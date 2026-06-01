from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime, timezone
from database import Base

class DashboardConfig(Base):
    __tablename__ = "dashboard_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class WidgetConfig(Base):
    __tablename__ = "widget_configs"

    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboard_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False) # e.g. "bar", "line", "area", "donut", "summary_card", "table"
    data_source = Column(String, nullable=False) # e.g. "monthly_cashflow", "category_breakdown", "top_merchants", "net_worth", "custom_query"
    query_config = Column(String, nullable=False) # JSON-string representation of filters, splits, intervals
    
    # Grid layout parameters
    layout_x = Column(Integer, default=0)
    layout_y = Column(Integer, default=0)
    layout_w = Column(Integer, default=6)
    layout_h = Column(Integer, default=4)
