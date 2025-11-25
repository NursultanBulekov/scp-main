import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Boolean, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class TimestampMixin:
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class RoleEnum(enum.Enum):
    consumer = "consumer"
    supplier_owner = "supplier_owner"
    supplier_manager = "supplier_manager"
    supplier_sales = "supplier_sales"
    platform_admin = "platform_admin"

class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    users = relationship("User", back_populates="supplier")
    products = relationship("Product", back_populates="supplier")
    catalogs = relationship("Catalog", back_populates="supplier")
    orders = relationship("Order", back_populates="supplier")

class Consumer(TimestampMixin, Base):
    __tablename__ = "consumers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    users = relationship("User", back_populates="consumer")
    orders = relationship("Order", back_populates="consumer")

class LinkStatusEnum(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    blocked = "blocked"

class SupplierConsumerLink(TimestampMixin, Base):
    __tablename__ = "supplier_consumer_links"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    consumer_id = Column(Integer, ForeignKey("consumers.id"), nullable=False)
    status = Column(Enum(LinkStatusEnum), default=LinkStatusEnum.pending)

    supplier = relationship("Supplier")
    consumer = relationship("Consumer")
    conversation = relationship("Conversation", back_populates="link", uselist=False, cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    role = Column(Enum(RoleEnum))
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    consumer_id = Column(Integer, ForeignKey("consumers.id"), nullable=True)
    
    supplier = relationship("Supplier", back_populates="users")
    consumer = relationship("Consumer", back_populates="users")
    messages = relationship("Message", back_populates="sender")

class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier = relationship("Supplier", back_populates="products")
    
    catalogs = relationship("Catalog", secondary="catalog_products", back_populates="products")

class Catalog(TimestampMixin, Base):
    __tablename__ = "catalogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier = relationship("Supplier", back_populates="catalogs")
    
    products = relationship("Product", secondary="catalog_products", back_populates="catalogs")

class CatalogProduct(Base):
    __tablename__ = "catalog_products"

    catalog_id = Column(Integer, ForeignKey("catalogs.id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)

    catalog = relationship("Catalog", overlaps="products")
    product = relationship("Product", overlaps="catalogs")

class OrderStatusEnum(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.pending)
    
    consumer_id = Column(Integer, ForeignKey("consumers.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    consumer = relationship("Consumer", back_populates="orders")
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False) # price at the time of order

    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class ComplaintStatusEnum(enum.Enum):
    opened = "opened"
    in_progress = "in_progress"
    resolved = "resolved"
    escalated = "escalated"

class Complaint(TimestampMixin, Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatusEnum), default=ComplaintStatusEnum.opened)
    
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    order = relationship("Order")
    creator = relationship("User", foreign_keys=[creator_id])
    handler = relationship("User", foreign_keys=[handler_id])

class Conversation(TimestampMixin, Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("supplier_consumer_links.id"), nullable=False, unique=True)

    link = relationship("SupplierConsumerLink", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(TimestampMixin, Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    attachment_url = Column(String, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages")