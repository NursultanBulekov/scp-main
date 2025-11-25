from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, dependencies, models, database

router = APIRouter()

@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if not current_user.consumer_id:
        raise HTTPException(status_code=403, detail="Not a consumer")
    
    # Check if consumer is linked to the supplier
    link = crud.get_link_by_supplier_consumer(db, supplier_id=order.supplier_id, consumer_id=current_user.consumer_id)
    if not link or link.status != models.LinkStatusEnum.accepted:
        raise HTTPException(status_code=403, detail="Not linked to this supplier")

    return crud.create_order(db=db, order=order, consumer_id=current_user.consumer_id)

@router.get("/", response_model=List[schemas.Order])
def read_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    orders_from_db = []
    if current_user.consumer_id:
        orders_from_db = crud.get_orders_by_consumer(db, consumer_id=current_user.consumer_id, skip=skip, limit=limit)
    elif current_user.supplier_id:
        orders_from_db = crud.get_orders_by_supplier(db, supplier_id=current_user.supplier_id, skip=skip, limit=limit)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Manually construct response to include conversation_id
    response_orders = []
    for order in orders_from_db:
        link = crud.get_link_by_supplier_consumer(db, supplier_id=order.supplier_id, consumer_id=order.consumer_id)
        order_schema = schemas.Order.from_orm(order)
        if link and link.conversation:
            order_schema.conversation_id = link.conversation.id
        response_orders.append(order_schema)
        
    return response_orders


@router.put("/{order_id}", response_model=schemas.Order)
def update_order_status(
    order_id: int,
    order_update: schemas.OrderUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    db_order = crud.get_order_by_id(db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Supplier-side logic
    if current_user.supplier_id:
        if db_order.supplier_id != current_user.supplier_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this order")
        
        # Prevent suppliers from using 'cancelled' status, which is consumer-only
        if order_update.status == models.OrderStatusEnum.cancelled:
            raise HTTPException(status_code=400, detail="Suppliers cannot cancel an order, they can only reject it.")
        
        return crud.update_order_status(db=db, order_id=order_id, status=order_update.status)

    # Consumer-side logic
    elif current_user.consumer_id:
        if db_order.consumer_id != current_user.consumer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this order")
        
        # Consumers can only cancel their own PENDING orders
        if order_update.status == models.OrderStatusEnum.cancelled:
            if db_order.status != models.OrderStatusEnum.pending:
                raise HTTPException(status_code=400, detail="Order can only be cancelled if it is currently pending.")
            return crud.update_order_status(db=db, order_id=order_id, status=order_update.status)
        else:
            raise HTTPException(status_code=403, detail="Consumers are only allowed to cancel an order.")
            
    else:
        raise HTTPException(status_code=403, detail="User role is not authorized to update orders.")