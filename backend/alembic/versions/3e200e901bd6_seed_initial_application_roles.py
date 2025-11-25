"""Seed initial application roles

Revision ID: 3e200e901bd6
Revises: ed2e623e0d36
Create Date: 2025-10-16 13:43:14.873076

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String


# revision identifiers, used by Alembic.
revision = '3e200e901bd6'
down_revision = 'ed2e623e0d36'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Inserts initial role data into the 'roles' table."""
    # Define the structure of the 'roles' table for bulk insertion
    # We use 'id' and 'name' based on your previous table definition.
    roles_table = table(
        'roles',
        column('id', String),
        column('name', String),
    )

    # Insert initial roles. These IDs must match your roleenum values.
    op.bulk_insert(roles_table, [
        {'id': 'supplier_owner', 'name': 'Supplier Owner'},
        {'id': 'supplier_manager', 'name': 'Supplier Manager'},
        {'id': 'supplier_sales', 'name': 'Supplier Sales'},
        {'id': 'consumer', 'name': 'Consumer'},
    ])


def downgrade() -> None:
    """Removes the inserted role data."""
    # We execute a raw SQL statement to remove the specific seed data.
    op.execute(
        "DELETE FROM roles WHERE id IN ('supplier_owner', 'supplier_manager', 'supplier_sales', 'consumer')"
    )

