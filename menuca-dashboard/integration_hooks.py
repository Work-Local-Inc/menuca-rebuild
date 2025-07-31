"""
Integration hooks to automatically capture progress from our development workflow
"""
from menuca_memory import menuca_memory
from datetime import datetime
import sys
import os

class MenuCAProgressTracker:
    """Automatically track progress as we work"""
    
    @staticmethod
    def track_todo_completion(todo_id: str, title: str, phase: str = "unknown", category: str = "development"):
        """Track when a TodoWrite item gets completed"""
        task_data = {
            "id": todo_id,
            "title": title,
            "phase": phase,
            "category": category,
            "completed_at": datetime.now().isoformat(),
            "duration_hours": "auto-tracked",
            "description": f"Automatically tracked completion of {title}",
            "source": "integration_hook"
        }
        
        menuca_memory.log_task_completion(task_data)
        return task_data
    
    @staticmethod  
    def track_technical_decision(decision_id: str, title: str, decision: str, reasoning: str, impact: str = ""):
        """Track technical decisions made during development"""
        decision_data = {
            "id": decision_id,
            "title": title,
            "decision": decision,
            "reasoning": reasoning,
            "impact": impact,
            "timestamp": datetime.now().isoformat(),
            "source": "integration_hook"
        }
        
        menuca_memory.log_technical_decision(decision_data)
        return decision_data
    
    @staticmethod
    def track_milestone(milestone_id: str, title: str, description: str, achievements: list = None):
        """Track major milestones"""
        milestone_data = {
            "id": milestone_id,
            "title": title,
            "description": description,
            "achievements": achievements or [],
            "timestamp": datetime.now().isoformat(),
            "source": "integration_hook"
        }
        
        menuca_memory.log_milestone(milestone_data)
        return milestone_data

# Example usage - track dashboard creation
tracker = MenuCAProgressTracker()

# Track dashboard completion
tracker.track_todo_completion(
    todo_id="DASHBOARD_CREATION",
    title="MenuCA Progress Dashboard with Real-time Memory Bank",
    phase="meta-tooling",
    category="development_tools"
)

# Track technical decision about dashboard architecture
tracker.track_technical_decision(
    decision_id="DASHBOARD_TECH_STACK",
    title="Dashboard Technology Stack Selection",
    decision="Streamlit + muscle-mem + Plotly for real-time progress visualization",
    reasoning="Streamlit provides rapid prototyping, muscle-mem handles memory persistence, Plotly creates interactive charts",
    impact="Automated progress tracking reduces manual overhead and provides real-time project visibility"
)

print("🔗 Integration hooks are ready!")
print("📊 Dashboard progress automatically logged to memory bank")
print("🔄 Ready to track future development progress")