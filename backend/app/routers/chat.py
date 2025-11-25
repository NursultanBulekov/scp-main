from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from typing import List, Dict
import json
from datetime import datetime

from .. import crud, schemas, dependencies, models
from ..database import get_db
from jose import JWTError, jwt
from ..security import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: int):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)

    async def broadcast(self, message: dict, conversation_id: int):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                # Convert datetime objects to ISO format strings
                message_json = json.loads(json.dumps(message, default=str))
                await connection.send_json(message_json)

manager = ConnectionManager()

@router.get("/conversations", response_model=List[schemas.ConversationWithLinkInfo])
def get_user_conversations(
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_conversations_for_user(db=db, user=current_user)

@router.get("/conversations/{conversation_id}/messages", response_model=List[schemas.Message])
def get_conversation_messages(
    conversation_id: int,
    current_user: models.User = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db)
):
    # First, check if user is part of the conversation
    conversation = crud.get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    is_participant = False
    if current_user.consumer_id and conversation.link.consumer_id == current_user.consumer_id:
        is_participant = True
    if current_user.supplier_id and conversation.link.supplier_id == current_user.supplier_id:
        is_participant = True
    
    if not is_participant:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
    
    return crud.get_messages_for_conversation(db=db, conversation_id=conversation_id)


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    db: Session = Depends(get_db)
):
    # --- Inlined User Authentication ---
    token = websocket.query_params.get("token")
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        token_data = schemas.TokenData(email=email)
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    # --- End of Authentication ---

    conversation = crud.get_conversation_by_id(db, conversation_id=conversation_id)
    if not conversation:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Conversation not found")
        return

    is_participant = False
    if user.consumer_id and conversation.link.consumer_id == user.consumer_id:
        is_participant = True
    if user.supplier_id and conversation.link.supplier_id == user.supplier_id:
        is_participant = True

    if not is_participant:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not a participant")
        return

    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_json()
            message_create = schemas.MessageCreate(content=data['content'])
            
            db_message = crud.create_message(
                db=db,
                msg=message_create,
                conversation_id=conversation_id,
                sender_id=user.id
            )
            
            # Use a schema to serialize the message with sender info
            message_data = schemas.Message.from_orm(db_message).model_dump()

            await manager.broadcast(message_data, conversation_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
