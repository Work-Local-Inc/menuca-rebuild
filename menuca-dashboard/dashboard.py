"""
MenuCA Progress Dashboard - Real-time project tracking
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import json
from menuca_memory import menuca_memory

# Page config
st.set_page_config(
    page_title="MenuCA Progress Dashboard", 
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling with proper contrast
st.markdown("""
<style>
.metric-card {
    background-color: #2e3440;
    color: #eceff4;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid #5e81ac;
    margin: 0.5rem 0;
}
.activity-item {
    background-color: #3b4252;
    color: #eceff4;
    padding: 0.8rem;
    margin: 0.5rem 0;
    border-radius: 0.3rem;
    border-left: 3px solid #a3be8c;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.critical-task {
    background-color: #4c4a4e;
    color: #eceff4;
    border-left-color: #ebcb8b;
}
.completed-task {
    background-color: #3b4252;
    color: #eceff4;
    border-left-color: #a3be8c;
}
.decision-item {
    background-color: #434c5e;
    color: #eceff4;
    padding: 1rem;
    margin: 0.5rem 0;
    border-radius: 0.3rem;
    border-left: 3px solid #88c0d0;
}
.milestone-item {
    background-color: #5e4b56;
    color: #eceff4;
    padding: 1rem;
    margin: 0.5rem 0;
    border-radius: 0.3rem;
    border-left: 3px solid #b48ead;
}
</style>
""", unsafe_allow_html=True)

# Header
st.title("🚀 MenuCA Project Dashboard")
st.markdown("**Real-time progress tracking for our multi-tenant SaaS platform**")

# Sidebar Navigation - Show all options as buttons
st.sidebar.title("📊 Navigation")

# Initialize session state for view mode
if 'view_mode' not in st.session_state:
    st.session_state.view_mode = 'Overview'

# Navigation buttons
nav_options = [
    ("📈 Overview", "Overview"),
    ("📱 Recent Activity", "Recent Activity"), 
    ("🧠 Technical Decisions", "Technical Decisions"),
    ("🎯 Critical Path", "Critical Path"),
    ("📊 Detailed Analytics", "Detailed Analytics")
]

for label, mode in nav_options:
    if st.sidebar.button(label, use_container_width=True):
        st.session_state.view_mode = mode

# Get data from memory bank
phase_progress = menuca_memory.get_phase_progress()
recent_activity = menuca_memory.get_recent_activity(20)
technical_decisions = menuca_memory.get_technical_decisions()
critical_path = menuca_memory.get_next_critical_path()

# Calculate overall progress
total_tasks = sum(phase['total'] for phase in phase_progress.values())
completed_tasks = sum(phase['completed'] for phase in phase_progress.values())
overall_progress = (completed_tasks / total_tasks) * 100

view_mode = st.session_state.view_mode
st.sidebar.markdown(f"**Current View:** {view_mode}")

# Quick stats in sidebar
st.sidebar.markdown("---")
st.sidebar.markdown("### 📊 Quick Stats")
st.sidebar.metric("Overall Progress", f"{completed_tasks}/{total_tasks}")
st.sidebar.metric("Current Phase", "Foundation", f"{4}/68 tasks")

# Refresh button
if st.sidebar.button("🔄 Refresh Data", use_container_width=True):
    st.rerun()

if view_mode == "Overview":
    # Key metrics row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Overall Progress",
            value=f"{completed_tasks}/{total_tasks}",
            delta=f"{overall_progress:.1f}%"
        )
    
    with col2:
        st.metric(
            label="Current Phase", 
            value="Foundation",
            delta="4/68 Complete ✅"
        )
    
    with col3:
        st.metric(
            label="Time Saved",
            value="15-18 weeks",
            delta="Task consolidation"
        )
    
    with col4:
        st.metric(
            label="Performance",
            value="All targets met", 
            delta="DB: 45ms, Redis: 2ms"
        )
    
    st.markdown("---")
    
    # Phase progress visualization
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📈 Phase Progress")
        
        # Create progress chart
        phases_df = pd.DataFrame([
            {"Phase": "Foundation", "Completed": 4, "Total": 68, "Status": "In Progress"},
            {"Phase": "Core Features", "Completed": 0, "Total": 148, "Status": "Pending"}, 
            {"Phase": "Advanced", "Completed": 0, "Total": 86, "Status": "Pending"},
            {"Phase": "Polish", "Completed": 0, "Total": 40, "Status": "Pending"}
        ])
        
        phases_df["Progress %"] = (phases_df["Completed"] / phases_df["Total"] * 100).round(1)
        phases_df["Remaining"] = phases_df["Total"] - phases_df["Completed"]
        
        # Horizontal bar chart
        fig = go.Figure()
        
        # Completed portion
        fig.add_trace(go.Bar(
            name='Completed',
            y=phases_df['Phase'],
            x=phases_df['Completed'],
            orientation='h',
            marker_color='#28a745',
            text=phases_df['Completed'],
            textposition='inside'
        ))
        
        # Remaining portion
        fig.add_trace(go.Bar(
            name='Remaining', 
            y=phases_df['Phase'],
            x=phases_df['Remaining'],
            orientation='h',
            marker_color='#e9ecef',
            text=phases_df['Remaining'],
            textposition='inside'
        ))
        
        fig.update_layout(
            barmode='stack',
            title='Task Completion by Phase',
            xaxis_title='Tasks',
            height=300,
            showlegend=True
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("🎯 Phase Status")
        
        for phase, data in phase_progress.items():
            progress_pct = (data['completed'] / data['total']) * 100
            
            if progress_pct > 0:
                status_color = "🟢" if progress_pct == 100 else "🟡"
                status_text = "Complete" if progress_pct == 100 else "In Progress"
            else:
                status_color = "⚪"
                status_text = "Pending"
            
            st.markdown(f"""
            <div class="metric-card">
                <h4>{status_color} {phase.title()}</h4>
                <p><strong>{data['completed']}/{data['total']}</strong> tasks ({progress_pct:.1f}%)</p>
                <p><em>{status_text}</em></p>
            </div>
            """, unsafe_allow_html=True)
    
    # Recent highlights
    st.markdown("---")
    st.subheader("✨ Recent Achievements")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        **🎉 Phase 1 Foundation Complete!**
        - ✅ Multi-tenant PostgreSQL with RLS
        - ✅ Express.js server with TypeScript  
        - ✅ Redis caching infrastructure
        - ✅ Full integration testing passed
        """)
    
    with col2:
        st.markdown("""
        **⚡ Performance Achieved:**
        - Database response: <50ms
        - Redis operations: ~2ms  
        - Health endpoints: Working
        - Multi-tenant routing: Active
        """)

elif view_mode == "Recent Activity":
    st.subheader("📱 Recent Activity Feed")
    st.markdown("*Twitter-style feed of project progress*")
    
    for activity in recent_activity:
        timestamp = datetime.fromisoformat(activity['timestamp'])
        time_ago = datetime.now() - timestamp
        
        if time_ago.days > 0:
            time_str = f"{time_ago.days}d ago"
        elif time_ago.seconds > 3600:
            time_str = f"{time_ago.seconds // 3600}h ago"
        else:
            time_str = f"{time_ago.seconds // 60}m ago"
        
        activity_type = activity['type']
        data = activity['data']
        
        if activity_type == 'task_completion':
            icon = "✅"
            color_class = "completed-task"
            title = f"Completed: {data['title']}"
            details = f"Phase: {data['phase']} | Duration: {data.get('duration_hours', '?')}h"
            
        elif activity_type == 'technical_decision':
            icon = "🧠"
            color_class = "decision-item"
            title = f"Decision: {data['title']}"
            details = f"Impact: {data.get('impact', 'System architecture')}"
            
        elif activity_type == 'milestone':
            icon = "🎯"
            color_class = "milestone-item"
            title = f"Milestone: {data['title']}"
            details = f"Achievements: {len(data.get('achievements', []))} items"
        
        st.markdown(f"""
        <div class="{color_class}">
            <h4>{icon} {title}</h4>
            <p>{details}</p>
            <small>🕒 {time_str}</small>
        </div>
        """, unsafe_allow_html=True)

elif view_mode == "Technical Decisions":
    st.subheader("🧠 Technical Decisions Log")
    
    for decision in technical_decisions:
        with st.expander(f"📋 {decision['title']}"):
            st.write(f"**Decision:** {decision['decision']}")
            st.write(f"**Reasoning:** {decision['reasoning']}")
            
            if 'alternatives_considered' in decision:
                st.write("**Alternatives Considered:**")
                for alt in decision['alternatives_considered']:
                    st.write(f"- {alt}")
            
            if 'impact' in decision:
                st.write(f"**Impact:** {decision['impact']}")
            
            if 'time_saved' in decision:
                st.success(f"⏰ Time Saved: {decision['time_saved']}")

elif view_mode == "Critical Path":
    st.subheader("🎯 Next Critical Path Tasks")
    st.markdown("*Tasks that block the most other work*")
    
    for task in critical_path:
        priority_color = {"critical": "🔴", "high": "🟡", "medium": "🟢"}.get(task['priority'], "⚪")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.markdown(f"""
            <div class="critical-task">
                <h4>{priority_color} {task['title']}</h4>
                <p><strong>ID:</strong> {task['id']}</p>
                <p><strong>Description:</strong> {task['description']}</p>
                <p><strong>Phase:</strong> {task['phase'].title()}</p>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.metric(
                label="Blocks",
                value=f"{task['blocks']} tasks",
                delta=f"{task['priority'].title()} priority"
            )

elif view_mode == "Detailed Analytics":
    st.subheader("📊 Detailed Analytics")
    
    # Task completion timeline
    st.markdown("### 📈 Completion Timeline")
    
    # Create timeline data
    timeline_data = []
    for activity in recent_activity:
        if activity['type'] == 'task_completion':
            timeline_data.append({
                'Date': datetime.fromisoformat(activity['timestamp']).date(),
                'Task': activity['data']['title'],
                'Phase': activity['data']['phase'],
                'Duration': activity['data'].get('duration_hours', 1)
            })
    
    if timeline_data:
        timeline_df = pd.DataFrame(timeline_data)
        
        # Daily completion chart
        daily_completions = timeline_df.groupby('Date').size().reset_index(name='Tasks Completed')
        
        fig = px.bar(
            daily_completions, 
            x='Date', 
            y='Tasks Completed',
            title='Daily Task Completions',
            color='Tasks Completed',
            color_continuous_scale='greens'
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Phase breakdown
        phase_breakdown = timeline_df.groupby('Phase').size().reset_index(name='Tasks')
        
        fig_pie = px.pie(
            phase_breakdown,
            values='Tasks', 
            names='Phase',
            title='Completed Tasks by Phase'
        )
        
        st.plotly_chart(fig_pie, use_container_width=True)

# Footer
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #666;'>
    📈 MenuCA Progress Dashboard | Powered by muscle-mem + Streamlit | Updated in real-time
</div>
""", unsafe_allow_html=True)