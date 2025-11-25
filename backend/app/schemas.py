from pydantic import BaseModel
from .models import RoleEnum, LinkStatusEnum, OrderStatusEnum, ComplaintStatusEnum
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: RoleEnum
    company_name: str # Used for creating a Supplier or Consumer

class TeamMemberCreate(UserBase):
    password: str
    role: RoleEnum

class User(UserBase):
    id: int
    role: RoleEnum
    supplier_id: Optional[int] = None
    consumer_id: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    supplier_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductUpdate(ProductBase):
    pass

# Catalog Schemas
class CatalogBase(BaseModel):
    name: str

class CatalogCreate(CatalogBase):
    product_ids: List[int] = []

class CatalogUpdate(CatalogBase):
    product_ids: Optional[List[int]] = None

class Catalog(CatalogBase):
    id: int
    supplier_id: int
    products: List[Product] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    users: List[User] = []
    products: List[Product] = []
    catalogs: List[Catalog] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Consumer Schemas
class ConsumerBase(BaseModel):
    name: str

class ConsumerCreate(ConsumerBase):
    pass

class Consumer(ConsumerBase):
    id: int
    users: List[User] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Link Schemas
class SupplierConsumerLinkBase(BaseModel):
    supplier_id: int
    consumer_id: int
    status: LinkStatusEnum

class SupplierConsumerLinkCreate(BaseModel):
    supplier_id: int

class SupplierConsumerLinkUpdate(BaseModel):
    status: LinkStatusEnum

class SupplierConsumerLink(SupplierConsumerLinkBase):
    id: int
    consumer: Consumer
    supplier: Supplier
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Order Schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price: float # price at time of order
    product: Product # Add nested Product schema

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    supplier_id: int
    status: OrderStatusEnum

class OrderCreate(BaseModel):
    supplier_id: int
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    consumer_id: int
    items: List[OrderItem] = []
    created_at: datetime
    updated_at: datetime
    conversation_id: Optional[int] = None

    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    status: OrderStatusEnum

# Admin Schemas
class SQLQuery(BaseModel):
    query: str


# Complaint Schemas
class ComplaintBase(BaseModel):
    description: str

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatusEnum] = None
    handler_id: Optional[int] = None

class Complaint(ComplaintBase):
    id: int
    order_id: int
    status: ComplaintStatusEnum
    creator_id: int
    handler_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    creator: "User"
    handler: Optional["User"] = None

    class Config:
        from_attributes = True

# Chat Schemas
class MessageBase(BaseModel):
    content: str
    attachment_url: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender_id: int
    created_at: datetime
    sender: "User"

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    link_id: int

class Conversation(ConversationBase):
    id: int
    messages: List[Message] = []

    class Config:
        from_attributes = True

class ConversationWithLinkInfo(Conversation):
    link: "SupplierConsumerLink"

    class Config:
        from_attributes = True