from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, dependencies, models, database
from ..dependencies import get_current_active_supplier, get_current_supplier_manager_or_owner

router = APIRouter()

@router.post("/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    return crud.create_supplier_product(db=db, product=product, supplier_id=current_user.supplier_id)


@router.get("/", response_model=list[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_supplier),
):
    return crud.get_products_by_supplier(db, supplier_id=current_user.supplier_id)


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None or db_product.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.update_product(db=db, product_id=product_id, product_update=product)


@router.delete("/{product_id}", response_model=schemas.Product)
def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None or db_product.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud.delete_product(db=db, product_id=product_id)