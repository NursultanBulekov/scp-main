from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, dependencies, models, database
from ..dependencies import get_current_active_supplier, get_current_supplier_manager_or_owner

router = APIRouter()

@router.post("/", response_model=schemas.Catalog)
def create_catalog(
    catalog: schemas.CatalogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    return crud.create_supplier_catalog(db=db, catalog=catalog, supplier_id=current_user.supplier_id)

@router.get("/", response_model=List[schemas.Catalog])
def read_catalogs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
    supplier_id: Optional[int] = None # New parameter
):
    if current_user.supplier_id:
        if supplier_id and supplier_id != current_user.supplier_id:
            raise HTTPException(status_code=403, detail="Not authorized to view other suppliers' catalogs.")
        catalogs = crud.get_catalogs_by_supplier(db, supplier_id=current_user.supplier_id, skip=skip, limit=limit)
        return catalogs
    elif current_user.consumer_id:
        if not supplier_id:
            # If consumer is requesting all catalogs, we need more complex logic to check all linked suppliers
            # For now, let's require supplier_id for consumer catalog browsing
            raise HTTPException(status_code=400, detail="Consumer must specify a supplier_id to browse catalogs.")

        # Check if consumer is linked to this specific supplier
        link = crud.get_link_by_supplier_consumer(db, supplier_id=supplier_id, consumer_id=current_user.consumer_id)
        if not link or link.status != models.LinkStatusEnum.accepted:
            raise HTTPException(status_code=403, detail="Not linked to this supplier or link is not accepted.")

        catalogs = crud.get_catalogs_by_supplier(db, supplier_id=supplier_id, skip=skip, limit=limit)
        return catalogs
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view catalogs.")

@router.get("/{catalog_id}", response_model=schemas.Catalog)
def read_catalog(
    catalog_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    db_catalog = crud.get_catalog(db, catalog_id=catalog_id)
    if db_catalog is None:
        raise HTTPException(status_code=404, detail="Catalog not found")

    # Check if user is the supplier or a linked consumer
    is_supplier = current_user.supplier_id == db_catalog.supplier_id
    link = crud.get_link_by_supplier_consumer(db, supplier_id=db_catalog.supplier_id, consumer_id=current_user.consumer_id)
    is_linked_consumer = link and link.status == models.LinkStatusEnum.accepted

    if not (is_supplier or is_linked_consumer):
        raise HTTPException(status_code=403, detail="Not authorized to view this catalog")

    return db_catalog

@router.put("/{catalog_id}", response_model=schemas.Catalog)
def update_catalog(
    catalog_id: int,
    catalog: schemas.CatalogUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    db_catalog = crud.get_catalog(db, catalog_id=catalog_id)
    if db_catalog is None or db_catalog.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return crud.update_catalog(db=db, catalog_id=catalog_id, catalog=catalog)


@router.delete("/{catalog_id}", response_model=schemas.Catalog)
def delete_catalog(
    catalog_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_manager_or_owner),
):
    db_catalog = crud.get_catalog(db, catalog_id=catalog_id)
    if db_catalog is None or db_catalog.supplier_id != current_user.supplier_id:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return crud.delete_catalog(db=db, catalog_id=catalog_id)