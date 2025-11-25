from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, crud, models, database
from ..dependencies import get_current_supplier_owner

router = APIRouter(
    prefix="/team",
    tags=["team"],
    responses={404: {"description": "Not found"}},
)

@router.post("/members/", response_model=schemas.User)
def add_team_member(
    member: schemas.TeamMemberCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_owner)
):
    if member.role not in [models.RoleEnum.supplier_manager, models.RoleEnum.supplier_sales]:
        raise HTTPException(
            status_code=400,
            detail="You can only add managers or sales representatives."
        )
    
    db_user = crud.get_user_by_email(db, email=member.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_team_member(db=db, member=member, supplier_id=current_user.supplier_id)

@router.get("/members/", response_model=list[schemas.User])
def get_team_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_supplier_owner)
):
    return crud.get_team_members_by_supplier(db, supplier_id=current_user.supplier_id, skip=skip, limit=limit)
