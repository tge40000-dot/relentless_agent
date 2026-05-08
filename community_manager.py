"""
Community Management System
Builds and manages the Relentless Billionaire community
"""

import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from openai_content import openai_generator
from sendgrid_email import sendgrid_email

class CommunityManager:
    """
    Community manager that:
    - Onboards new members
    - Facilitates discussions
    - Organizes events
    - Tracks engagement
    - Builds relationships
    """
    
    def __init__(self):
        self.members = {}
        self.discussions = []
        self.events = []
        self.engagement_metrics = {}
        
        # Community values
        self.mission = "Building a community that helps entrepreneurs succeed through revenue generation"
        self.values = ["collaboration", "growth", "support", "authenticity", "excellence"]
        
        # Load existing community data
        self._load_community_data()
    
    def onboard_member(self, member: Dict) -> Dict:
        """Onboard a new community member"""
        member_id = member.get('email') or member.get('company')
        
        # Create member profile
        member_profile = {
            "id": member_id,
            "name": member.get('name', member.get('contact', 'Unknown')),
            "company": member.get('company', 'Unknown'),
            "industry": member.get('industry', 'Unknown'),
            "email": member.get('email', ''),
            "joined_date": datetime.now().isoformat(),
            "status": "active",
            "engagement_score": 0,
            "contributions": [],
            "connections": []
        }
        
        self.members[member_id] = member_profile
        
        # Send welcome email
        self._send_welcome_email(member_profile)
        
        # Save data
        self._save_community_data()
        
        print(f"✓ Member onboarded: {member_profile['name']} ({member_profile['company']})")
        return member_profile
    
    def create_discussion(self, topic: str, author: str, content: str = None) -> Dict:
        """Create a new community discussion"""
        if not content:
            # Generate content using AI
            content = openai_generator.generate_community_content(topic, "discussion")
        
        discussion = {
            "id": f"disc_{len(self.discussions) + 1}",
            "topic": topic,
            "content": content,
            "author": author,
            "created_at": datetime.now().isoformat(),
            "replies": [],
            "likes": 0,
            "views": 0,
            "tags": self._extract_tags(topic)
        }
        
        self.discussions.append(discussion)
        self._save_community_data()
        
        # Notify relevant members
        self._notify_discussion(discussion)
        
        print(f"✓ Discussion created: {topic}")
        return discussion
    
    def add_reply(self, discussion_id: str, author: str, reply: str) -> Dict:
        """Add reply to discussion"""
        discussion = next((d for d in self.discussions if d['id'] == discussion_id), None)
        
        if not discussion:
            return {"error": "Discussion not found"}
        
        reply_data = {
            "author": author,
            "content": reply,
            "created_at": datetime.now().isoformat(),
            "likes": 0
        }
        
        discussion['replies'].append(reply_data)
        discussion['views'] += 1
        
        # Update member engagement
        if author in self.members:
            self.members[author]['engagement_score'] += 5
        
        self._save_community_data()
        
        print(f"✓ Reply added to discussion {discussion_id}")
        return reply_data
    
    def organize_event(self, event: Dict) -> Dict:
        """Organize a community event"""
        event_data = {
            "id": f"event_{len(self.events) + 1}",
            "title": event.get('title', 'Community Event'),
            "description": event.get('description', ''),
            "type": event.get('type', 'webinar'),  # webinar, meetup, workshop
            "date": event.get('date', ''),
            "time": event.get('time', ''),
            "duration": event.get('duration', '1 hour'),
            "max_attendees": event.get('max_attendees', 100),
            "attendees": [],
            "created_at": datetime.now().isoformat(),
            "status": "upcoming"
        }
        
        self.events.append(event_data)
        self._save_community_data()
        
        # Notify community
        self._notify_event(event_data)
        
        print(f"✓ Event organized: {event_data['title']}")
        return event_data
    
    def rsvp_event(self, event_id: str, member_id: str) -> bool:
        """RSVP to an event"""
        event = next((e for e in self.events if e['id'] == event_id), None)
        
        if not event:
            print(f"✗ Event not found: {event_id}")
            return False
        
        if len(event['attendees']) >= event['max_attendees']:
            print(f"✗ Event is full: {event['title']}")
            return False
        
        if member_id not in event['attendees']:
            event['attendees'].append(member_id)
            
            # Update member engagement
            if member_id in self.members:
                self.members[member_id]['engagement_score'] += 10
            
            self._save_community_data()
            print(f"✓ RSVP confirmed for {member_id}")
            return True
        
        return False
    
    def track_engagement(self) -> Dict:
        """Track community engagement metrics"""
        total_members = len(self.members)
        active_members = sum(1 for m in self.members.values() if m['engagement_score'] > 0)
        total_discussions = len(self.discussions)
        total_replies = sum(len(d['replies']) for d in self.discussions)
        total_events = len(self.events)
        upcoming_events = sum(1 for e in self.events if e['status'] == 'upcoming')
        
        avg_engagement = sum(m['engagement_score'] for m in self.members.values()) / max(1, total_members)
        
        metrics = {
            "total_members": total_members,
            "active_members": active_members,
            "activity_rate": f"{(active_members / max(1, total_members)):.1%}",
            "total_discussions": total_discussions,
            "total_replies": total_replies,
            "avg_replies_per_discussion": total_replies / max(1, total_discussions),
            "total_events": total_events,
            "upcoming_events": upcoming_events,
            "avg_engagement_score": round(avg_engagement, 2)
        }
        
        self.engagement_metrics = metrics
        return metrics
    
    def facilitate_connection(self, member1: str, member2: str, reason: str = None) -> bool:
        """Facilitate connection between members"""
        if member1 not in self.members or member2 not in self.members:
            print(f"✗ One or both members not found")
            return False
        
        # Check if already connected
        if member2 in self.members[member1]['connections']:
            print(f"✓ Members already connected")
            return True
        
        # Generate introduction message
        m1 = self.members[member1]
        m2 = self.members[member2]
        
        intro = f"""
        Hi {m1['name']},
        
        I'd like to introduce you to {m2['name']} from {m2['company']}.
        
        {reason if reason else f"You both are in the {m1['industry']} industry and might benefit from connecting."}
        
        {m2['name']}'s expertise: {m2.get('expertise', 'Business growth')}
        
        I hope this connection is valuable for both of you!
        
        Best,
        Relentless Billionaire Community Team
        """
        
        # Send introduction email
        if m1['email']:
            sendgrid_email.send_email(
                m1['email'],
                f"Introduction to {m2['name']}",
                intro,
                intro
            )
        
        # Record connection
        self.members[member1]['connections'].append(member2)
        self.members[member2]['connections'].append(member1)
        
        # Update engagement
        self.members[member1]['engagement_score'] += 15
        self.members[member2]['engagement_score'] += 15
        
        self._save_community_data()
        
        print(f"✓ Connection facilitated: {m1['name']} <-> {m2['name']}")
        return True
    
    def generate_weekly_digest(self) -> str:
        """Generate weekly community digest"""
        metrics = self.track_engagement()
        
        # Get top discussions
        top_discussions = sorted(
            self.discussions,
            key=lambda x: len(x['replies']) + x['likes'],
            reverse=True
        )[:5]
        
        # Get upcoming events
        upcoming = [e for e in self.events if e['status'] == 'upcoming'][:3]
        
        digest = f"""
        # Relentless Billionaire Community Weekly Digest
        
        ## Community Metrics
        - Total Members: {metrics['total_members']}
        - Active Members: {metrics['active_members']} ({metrics['activity_rate']})
        - Discussions: {metrics['total_discussions']}
        - Events: {metrics['upcoming_events']} upcoming
        
        ## Top Discussions This Week
        """
        
        for disc in top_discussions:
            digest += f"\n- {disc['topic']} ({len(disc['replies'])} replies)"
        
        digest += "\n\n## Upcoming Events\n"
        
        for event in upcoming:
            digest += f"\n- {event['title']} on {event['date']}"
        
        digest += "\n\n---\nKeep building and growing together!"
        
        return digest
    
    def _send_welcome_email(self, member: Dict):
        """Send welcome email to new member"""
        welcome_content = f"""
        Welcome to the Relentless Billionaire Community, {member['name']}!
        
        We're thrilled to have you join us. Our mission is to help entrepreneurs like you succeed through revenue generation and community support.
        
        What to expect:
        - Connect with fellow entrepreneurs
        - Share insights and learn from others
        - Participate in exclusive events
        - Access valuable resources
        
        Your next steps:
        1. Complete your profile
        2. Introduce yourself in the community
        3. Join upcoming discussions
        4. RSVP to our next event
        
        Together, we'll build successful businesses and support each other's growth.
        
        Welcome to the community!
        
        Best regards,
        Relentless Billionaire Team
        """
        
        if member['email']:
            sendgrid_email.send_email(
                member['email'],
                f"Welcome to Relentless Billionaire Community, {member['name']}!",
                welcome_content,
                welcome_content
            )
    
    def _notify_discussion(self, discussion: Dict):
        """Notify members about new discussion"""
        # In production, send notifications to relevant members
        pass
    
    def _notify_event(self, event: Dict):
        """Notify community about new event"""
        # In production, send event notifications
        pass
    
    def _extract_tags(self, topic: str) -> List[str]:
        """Extract tags from topic"""
        keywords = ['revenue', 'growth', 'marketing', 'sales', 'funding', 'scaling', 'hiring']
        tags = []
        
        for keyword in keywords:
            if keyword in topic.lower():
                tags.append(keyword)
        
        return tags if tags else ['general']
    
    def _load_community_data(self):
        """Load community data from file"""
        try:
            if os.path.exists("logs/community_data.json"):
                with open("logs/community_data.json", 'r') as f:
                    data = json.load(f)
                    self.members = data.get('members', {})
                    self.discussions = data.get('discussions', [])
                    self.events = data.get('events', [])
        except json.JSONDecodeError as e:
            print(f"✗ Error loading community data (invalid JSON): {e}")
            self.members = {}
            self.discussions = []
            self.events = []
        except Exception as e:
            print(f"✗ Error loading community data: {e}")
            self.members = {}
            self.discussions = []
            self.events = []
    
    def _save_community_data(self):
        """Save community data to file"""
        os.makedirs("logs", exist_ok=True)
        
        try:
            data = {
                "members": self.members,
                "discussions": self.discussions,
                "events": self.events,
                "last_updated": datetime.now().isoformat()
            }
            
            with open("logs/community_data.json", 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            print(f"✗ Error saving community data: {e}")

# Singleton instance
community_manager = CommunityManager()

if __name__ == "__main__":
    # Test community manager
    print("Testing Community Manager...")
    
    # Onboard a member
    test_member = {
        "name": "John Doe",
        "company": "Tech Startup Inc",
        "industry": "Technology",
        "email": "john@techstartup.com"
    }
    
    member = community_manager.onboard_member(test_member)
    print(f"\n✓ Member onboarded: {member['name']}")
    
    # Create discussion
    discussion = community_manager.create_discussion("Revenue growth strategies for startups", member['id'])
    print(f"\n✓ Discussion created: {discussion['topic']}")
    
    # Track engagement
    metrics = community_manager.track_engagement()
    print(f"\n📊 Community Metrics:")
    print(f"Total Members: {metrics['total_members']}")
    print(f"Active Members: {metrics['active_members']}")
    print(f"Total Discussions: {metrics['total_discussions']}")
