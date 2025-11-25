from sqlalchemy.orm import Session, joinedload
from . import models, schemas, security
from fastapi import HTTPException
from .security import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role)
    
    if user.role in [models.RoleEnum.supplier_owner, models.RoleEnum.supplier_manager, models.RoleEnum.supplier_sales]:
        # Check if a supplier with this name already exists or create a new one
        db_supplier = db.query(models.Supplier).filter(models.Supplier.name == user.company_name).first()
        if not db_supplier:
            db_supplier = models.Supplier(name=user.company_name)
            db.add(db_supplier)
            db.flush() # Flush to get the supplier ID
        db_user.supplier_id = db_supplier.id
    elif user.role == models.RoleEnum.consumer:
        # Check if a consumer with this name already exists or create a new one
        db_consumer = db.query(models.Consumer).filter(models.Consumer.name == user.company_name).first()
        if not db_consumer:
            db_consumer = models.Consumer(name=user.company_name)
            db.add(db_consumer)
            db.flush() # Flush to get the consumer ID
        db_user.consumer_id = db_consumer.id

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_team_member(db: Session, member: schemas.TeamMemberCreate, supplier_id: int):
    hashed_password = get_password_hash(member.password)
    db_user = models.User(
        email=member.email,
        hashed_password=hashed_password,
        role=member.role,
        supplier_id=supplier_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def get_team_members_by_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.User).filter(models.User.supplier_id == supplier_id).offset(skip).limit(limit).all()

# Complaint CRUD
def create_complaint(db: Session, complaint: schemas.ComplaintCreate, order_id: int, creator_id: int):
    db_complaint = models.Complaint(
        **complaint.model_dump(),
        order_id=order_id,
        creator_id=creator_id
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaint(db: Session, complaint_id: int):
    return db.query(models.Complaint).options(joinedload(models.Complaint.handler)).filter(models.Complaint.id == complaint_id).first()

def get_complaints_by_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Complaint).options(joinedload(models.Complaint.handler)).join(models.Order).filter(models.Order.supplier_id == supplier_id).offset(skip).limit(limit).all()

def get_complaints_by_consumer(db: Session, consumer_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Complaint).options(joinedload(models.Complaint.handler)).join(models.Order).filter(models.Order.consumer_id == consumer_id).offset(skip).limit(limit).all()

def update_complaint(db: Session, complaint_id: int, complaint_update: schemas.ComplaintUpdate):
    db_complaint = get_complaint(db, complaint_id)
    if not db_complaint:
        return None
    
    update_data = complaint_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_complaint, key, value)
    
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

# Product CRUD
def create_supplier_product(db: Session, product: schemas.ProductCreate, supplier_id: int):
    db_product = models.Product(**product.model_dump(), supplier_id=supplier_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_products_by_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Product).filter(models.Product.supplier_id == supplier_id).offset(skip).limit(limit).all()

def get_product_by_id(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product_by_id(db, product_id)
    if db_product:
        update_data = product.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product_by_id(db, product_id)
    if db_product:
        # Before deleting the product, we need to remove it from any catalogs
        db.query(models.CatalogProduct).filter(models.CatalogProduct.product_id == product_id).delete()
        db.delete(db_product)
        db.commit()
    return db_product

# Catalog CRUD
def create_supplier_catalog(db: Session, catalog: schemas.CatalogCreate, supplier_id: int):
    db_catalog = models.Catalog(name=catalog.name, supplier_id=supplier_id)
    db.add(db_catalog)
    db.commit()
    db.refresh(db_catalog)
    # Add products to catalog
    for product_id in catalog.product_ids:
        db_catalog_product = models.CatalogProduct(catalog_id=db_catalog.id, product_id=product_id)
        db.add(db_catalog_product)
    db.commit()
    db.refresh(db_catalog)
    return db_catalog

def get_catalogs_by_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Catalog).options(joinedload(models.Catalog.products)).filter(models.Catalog.supplier_id == supplier_id).offset(skip).limit(limit).all()

def get_catalog(db: Session, catalog_id: int):
    return db.query(models.Catalog).options(joinedload(models.Catalog.products)).filter(models.Catalog.id == catalog_id).first()

def update_catalog(db: Session, catalog_id: int, catalog: schemas.CatalogUpdate):
    db_catalog = get_catalog(db, catalog_id=catalog_id)
    if not db_catalog:
        return None

    update_data = catalog.model_dump(exclude_unset=True)
    if 'name' in update_data:
        db_catalog.name = update_data['name']
    
    if catalog.product_ids is not None:
        # Clear existing products and add new ones
        db.query(models.CatalogProduct).filter(models.CatalogProduct.catalog_id == catalog_id).delete()
        for product_id in catalog.product_ids:
            db_catalog_product = models.CatalogProduct(catalog_id=catalog_id, product_id=product_id)
            db.add(db_catalog_product)

    db.commit()
    db.refresh(db_catalog)
    return db_catalog
    
def delete_catalog(db: Session, catalog_id: int):
    db_catalog = get_catalog(db, catalog_id=catalog_id)
    if db_catalog:
        # Dissociate products from the catalog before deleting
        db.query(models.CatalogProduct).filter(models.CatalogProduct.catalog_id == catalog_id).delete()
        db.delete(db_catalog)
        db.commit()
    return db_catalog

# Order CRUD
def create_order(db: Session, order: schemas.OrderCreate, consumer_id: int):
    db_order = models.Order(supplier_id=order.supplier_id, consumer_id=consumer_id, status=models.OrderStatusEnum.pending)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    total_price = 0
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product or product.supplier_id != order.supplier_id:
            # Handle error: product not found or doesn't belong to the supplier
            continue
        db_order_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=product.price  # Use current product price
        )
        db.add(db_order_item)
        total_price += product.price * item.quantity

    db.commit()
    db.refresh(db_order)
    return db_order

def get_orders_by_consumer(db: Session, consumer_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.consumer_id == consumer_id).offset(skip).limit(limit).all()

def get_orders_by_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.supplier_id == supplier_id).offset(skip).limit(limit).all()

def get_order_by_id(db: Session, order_id: int):
    return db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product)
    ).filter(models.Order.id == order_id).first()

def update_order_status(db: Session, order_id: int, status: models.OrderStatusEnum):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None

    # Logic to handle stock updates
    if status == models.OrderStatusEnum.accepted and db_order.status != models.OrderStatusEnum.accepted:
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                if product.stock < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Not enough stock for product {product.name}")
                product.stock -= item.quantity
    elif db_order.status == models.OrderStatusEnum.accepted and status in [models.OrderStatusEnum.rejected, models.OrderStatusEnum.cancelled]:
        # Optional: restock items if an accepted order is cancelled or rejected
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    db_order.status = status
    db.commit()
    db.refresh(db_order)
    return db_order

# Supplier-Consumer Link CRUD
def create_link(db: Session, supplier_id: int, consumer_id: int):
    db_link = models.SupplierConsumerLink(supplier_id=supplier_id, consumer_id=consumer_id, status=models.LinkStatusEnum.pending)
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

def update_link_status(db: Session, link_id: int, status: models.LinkStatusEnum):
    db_link = db.query(models.SupplierConsumerLink).filter(models.SupplierConsumerLink.id == link_id).first()
    if db_link:
        db_link.status = status
        db.commit()
        db.refresh(db_link)

        if status == models.LinkStatusEnum.accepted:
            # Create a conversation when the link is accepted
            get_or_create_conversation(db=db, link_id=db_link.id)

    return db_link

def get_link_by_supplier_consumer(db: Session, supplier_id: int, consumer_id: int):
    return db.query(models.SupplierConsumerLink).filter_by(supplier_id=supplier_id, consumer_id=consumer_id).first()

def get_all_suppliers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Supplier).offset(skip).limit(limit).all()

def get_supplier_by_id(db: Session, supplier_id: int):
    return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

def get_links_for_consumer(db: Session, consumer_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.SupplierConsumerLink).filter(models.SupplierConsumerLink.consumer_id == consumer_id).offset(skip).limit(limit).all()

def get_pending_links_for_supplier(db: Session, supplier_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.SupplierConsumerLink).options(joinedload(models.SupplierConsumerLink.consumer)).filter(models.SupplierConsumerLink.supplier_id == supplier_id, models.SupplierConsumerLink.status == models.LinkStatusEnum.pending).offset(skip).limit(limit).all()

# Conversation CRUD
def get_or_create_conversation(db: Session, link_id: int):
    db_conversation = db.query(models.Conversation).filter(models.Conversation.link_id == link_id).first()
    if not db_conversation:
        db_conversation = models.Conversation(link_id=link_id)
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
    return db_conversation

def get_conversation_by_id(db: Session, conversation_id: int):
    return db.query(models.Conversation).options(joinedload(models.Conversation.link)).filter(models.Conversation.id == conversation_id).first()

def get_conversations_for_user(db: Session, user: models.User, skip: int = 0, limit: int = 100):
    query = db.query(models.Conversation).join(models.SupplierConsumerLink).options(
        joinedload(models.Conversation.link).joinedload(models.SupplierConsumerLink.supplier),
        joinedload(models.Conversation.link).joinedload(models.SupplierConsumerLink.consumer)
    )
    if user.consumer_id:
        return query.filter(models.SupplierConsumerLink.consumer_id == user.consumer_id).offset(skip).limit(limit).all()
    if user.supplier_id:
        return query.filter(models.SupplierConsumerLink.supplier_id == user.supplier_id).offset(skip).limit(limit).all()
    return []

def create_message(db: Session, msg: schemas.MessageCreate, conversation_id: int, sender_id: int):
    db_message = models.Message(
        **msg.model_dump(),
        conversation_id=conversation_id,
        sender_id=sender_id
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_messages_for_conversation(db: Session, conversation_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.created_at.asc()).offset(skip).limit(limit).all()


# Admin Stats
def get_user_count(db: Session):
    return db.query(models.User).count()

def get_supplier_count(db: Session):
    return db.query(models.Supplier).count()

def get_consumer_count(db: Session):
    return db.query(models.Consumer).count()
