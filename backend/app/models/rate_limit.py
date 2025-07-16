from sqlalchemy import Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class RateLimit(Base):
    __tablename__ = "rate_limits"
    
    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String(255), nullable=False)
    tier = Column(String(20), nullable=False)
    requests = Column(Integer, nullable=False)
    window = Column(Integer, nullable=False)  # Window in seconds
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('endpoint', 'tier', name='uq_rate_limits_endpoint_tier'),
    )