from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, dependencies, models, database

router = APIRouter()

@router.post("/", response_model=schemas.SupplierConsumerLink)
def request_link(
    link_create: schemas.SupplierConsumerLinkCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if not current_user.consumer_id:
        raise HTTPException(status_code=403, detail="Only consumers can request a link")

    existing_link = crud.get_link_by_supplier_consumer(db, supplier_id=link_create.supplier_id, consumer_id=current_user.consumer_id)
    if existing_link:
        raise HTTPException(status_code=400, detail="Link already requested or exists")

    return crud.create_link(db=db, supplier_id=link_create.supplier_id, consumer_id=current_user.consumer_id)

@router.put("/{link_id}", response_model=schemas.SupplierConsumerLink)
def update_link(
    link_id: int,
    link_update: schemas.SupplierConsumerLinkUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if not current_user.supplier_id:
        raise HTTPException(status_code=403, detail="Only suppliers can update a link status")
    
    db_link = db.query(models.SupplierConsumerLink).filter(models.SupplierConsumerLink.id == link_id).first()

    if not db_link or db_link.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=404, detail="Link not found or not authorized")

    return crud.update_link_status(db=db, link_id=link_id, status=link_update.status)
