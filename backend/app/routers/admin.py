from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from .. import dependencies, models, database, crud, schemas

router = APIRouter()

def is_admin(current_user: models.User = Depends(dependencies.get_current_user)):
    if current_user.role != models.RoleEnum.platform_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource."
        )
    return current_user

@router.post("/execute-sql")
def execute_sql(
    sql_query: schemas.SQLQuery,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(is_admin)
):
    query = sql_query.query
    # Security check: Prevent DDL statements
    disallowed_keywords = ["CREATE", "ALTER", "DROP", "TRUNCATE", "GRANT", "REVOKE"]
    if any(keyword in query.upper() for keyword in disallowed_keywords):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DML statements (SELECT, INSERT, UPDATE, DELETE) are allowed."
        )

    try:
        result = db.execute(text(query))
        if result.returns_rows:
            rows = result.fetchall()
            # Convert to a list of dicts for JSON serialization
            data = [row._asdict() for row in rows]
            return {"status": "success", "data": data, "rows_affected": len(data)}
        else:
            db.commit()
            return {"status": "success", "rows_affected": result.rowcount}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query failed: {str(e)}"
        )

@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(is_admin)
):
    user_count = crud.get_user_count(db)
    supplier_count = crud.get_supplier_count(db)
    consumer_count = crud.get_consumer_count(db)
    return {
        "users": user_count,
        "suppliers": supplier_count,
        "consumers": consumer_count
    }
