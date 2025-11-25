from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import schemas, crud, models, database
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
    responses={404: {"description": "Not found"}},
)

@router.post("/order/{order_id}", response_model=schemas.Complaint)
def create_complaint_for_order(
    order_id: int,
    complaint: schemas.ComplaintCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.RoleEnum.consumer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only consumers can create complaints.")
    
    order = crud.get_order_by_id(db, order_id=order_id)
    if not order or order.consumer_id != current_user.consumer_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found or you are not the owner.")

    return crud.create_complaint(db=db, complaint=complaint, order_id=order_id, creator_id=current_user.id)

@router.get("/", response_model=list[schemas.Complaint])
def read_complaints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == models.RoleEnum.consumer:
        return crud.get_complaints_by_consumer(db, consumer_id=current_user.consumer_id, skip=skip, limit=limit)
    
    if current_user.supplier_id:
        return crud.get_complaints_by_supplier(db, supplier_id=current_user.supplier_id, skip=skip, limit=limit)
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view complaints.")

@router.get("/{complaint_id}", response_model=schemas.Complaint)
def read_complaint(
    complaint_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    
    # Check permission
    is_consumer_owner = current_user.role == models.RoleEnum.consumer and complaint.creator_id == current_user.id
    is_supplier_staff = current_user.supplier_id and complaint.order.supplier_id == current_user.supplier_id

    if not (is_consumer_owner or is_supplier_staff):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to view this complaint.")
        
    return complaint

@router.put("/{complaint_id}", response_model=schemas.Complaint)
def update_complaint_status(
    complaint_id: int,
    complaint_update: schemas.ComplaintUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_complaint = crud.get_complaint(db, complaint_id=complaint_id)
    if not db_complaint or db_complaint.order.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found or not part of your organization.")

    # Role-based logic for updating
    user_role = current_user.role
    update_data = complaint_update.model_dump(exclude_unset=True)

    if 'handler_id' in update_data and update_data['handler_id'] is None:
        update_data['handler_id'] = current_user.id
    
    # Sales can start progress or escalate
    if user_role == models.RoleEnum.supplier_sales:
        allowed_statuses = [models.ComplaintStatusEnum.in_progress, models.ComplaintStatusEnum.escalated]
        if 'status' in update_data and models.ComplaintStatusEnum(update_data['status']) not in allowed_statuses:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sales can only set status to 'in_progress' or 'escalated'.")
        update_data['handler_id'] = current_user.id # Assign self

    # Manager can do more
    elif user_role == models.RoleEnum.supplier_manager:
        allowed_statuses = [models.ComplaintStatusEnum.in_progress, models.ComplaintStatusEnum.resolved]
        if 'status' in update_data and models.ComplaintStatusEnum(update_data['status']) not in allowed_statuses:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Managers can set status to 'in_progress' or 'resolved'.")
        update_data['handler_id'] = current_user.id # Assign self

    # Owner can do anything
    elif user_role != models.RoleEnum.supplier_owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update complaints.")

    return crud.update_complaint(db=db, complaint_id=complaint_id, complaint_update=schemas.ComplaintUpdate(**update_data))
