from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, dependencies, models, database

router = APIRouter()

@router.get("/suppliers", response_model=List[schemas.Supplier])
def get_all_suppliers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user) # Ensure authenticated
):
    # Only consumers should typically browse all suppliers to link
    if not current_user.consumer_id and not current_user.role == models.RoleEnum.platform_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_all_suppliers(db, skip=skip, limit=limit)

@router.get("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    # Any authenticated user should be able to get basic supplier info
    db_supplier = crud.get_supplier_by_id(db, supplier_id=supplier_id)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return db_supplier

@router.get("/suppliers/{supplier_id}/links", response_model=schemas.SupplierConsumerLink)
def get_supplier_consumer_link(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if not current_user.consumer_id:
        raise HTTPException(status_code=403, detail="Not a consumer")
    
    link = crud.get_link_by_supplier_consumer(db, supplier_id=supplier_id, consumer_id=current_user.consumer_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    return link


@router.get("/consumers/{consumer_id}/links", response_model=List[schemas.SupplierConsumerLink])
def get_consumer_links(
    consumer_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    # Only the consumer themselves or a platform admin can view their links
    if current_user.consumer_id != consumer_id and current_user.role != models.RoleEnum.platform_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view these links")
    return crud.get_links_for_consumer(db, consumer_id=consumer_id)

@router.get("/suppliers/{supplier_id}/pending-links", response_model=List[schemas.SupplierConsumerLink])
def get_supplier_pending_links(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    # Only the supplier owner/manager can view pending links for their supplier
    if not current_user.supplier_id == supplier_id or current_user.role not in [models.RoleEnum.supplier_owner, models.RoleEnum.supplier_manager]:
        raise HTTPException(status_code=403, detail="Not authorized to view pending links for this supplier")
    return crud.get_pending_links_for_supplier(db, supplier_id=supplier_id)
