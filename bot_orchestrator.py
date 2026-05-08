import asyncio
import time
from typing import Dict, List, Optional
from datetime import datetime
import requests
from dataclasses import dataclass

@dataclass
class BotInstance:
    id: str
    bot_type: str
    status: str  # active, idle, error
    jobs_completed: int
    jobs_failed: int
    avg_execution_time: float
    last_active: datetime
    load_percentage: float

class BotOrchestrator:
    def __init__(self):
        self.bots: Dict[str, List[BotInstance]] = {}
        self.auto_mode = True
        self.job_queue = asyncio.Queue()
        self.running = False
        
        # Bot configurations
        self.bot_configs = {
            "lead_generation": {"max_instances": 5, "target_load": 70},
            "crm_intake": {"max_instances": 5, "target_load": 70},
            "crm_scoring": {"max_instances": 3, "target_load": 70},
            "flyer_production": {"max_instances": 3, "target_load": 70},
            "outreach": {"max_instances": 5, "target_load": 70}
        }
        
        # Initialize bots
        self._initialize_bots()
    
    def _initialize_bots(self):
        """Initialize default bot instances"""
        for bot_type, config in self.bot_configs.items():
            self.bots[bot_type] = [
                BotInstance(
                    id=f"{bot_type}_0",
                    bot_type=bot_type,
                    status="idle",
                    jobs_completed=0,
                    jobs_failed=0,
                    avg_execution_time=0.0,
                    last_active=datetime.now(),
                    load_percentage=0.0
                )
            ]
    
    def get_bot_status(self) -> Dict:
        """Get status of all bots"""
        status = {}
        for bot_type, instances in self.bots.items():
            status[bot_type] = {
                "instances": len(instances),
                "active": sum(1 for b in instances if b.status == "active"),
                "idle": sum(1 for b in instances if b.status == "idle"),
                "error": sum(1 for b in instances if b.status == "error"),
                "total_jobs": sum(b.jobs_completed for b in instances),
                "success_rate": self._calculate_success_rate(instances),
                "avg_time": self._calculate_avg_time(instances),
                "avg_load": sum(b.load_percentage for b in instances) / len(instances) if instances else 0
            }
        return status
    
    def _calculate_success_rate(self, instances: List[BotInstance]) -> float:
        total = sum(b.jobs_completed + b.jobs_failed for b in instances)
        if total == 0:
            return 0.0
        completed = sum(b.jobs_completed for b in instances)
        return (completed / total) * 100
    
    def _calculate_avg_time(self, instances: List[BotInstance]) -> float:
        times = [b.avg_execution_time for b in instances if b.avg_execution_time > 0]
        if not times:
            return 0.0
        return sum(times) / len(times)
    
    def scale_bot(self, bot_type: str, target_instances: int) -> bool:
        """Scale bot to target number of instances"""
        if bot_type not in self.bot_configs:
            return False
        
        max_instances = self.bot_configs[bot_type]["max_instances"]
        if target_instances > max_instances:
            target_instances = max_instances
        
        current_instances = len(self.bots[bot_type])
        
        if target_instances > current_instances:
            # Scale up
            for i in range(current_instances, target_instances):
                self.bots[bot_type].append(
                    BotInstance(
                        id=f"{bot_type}_{i}",
                        bot_type=bot_type,
                        status="idle",
                        jobs_completed=0,
                        jobs_failed=0,
                        avg_execution_time=0.0,
                        last_active=datetime.now(),
                        load_percentage=0.0
                    )
                )
            return True
        elif target_instances < current_instances:
            # Scale down (remove idle instances first)
            idle_instances = [b for b in self.bots[bot_type] if b.status == "idle"]
            to_remove = current_instances - target_instances
            for i in range(min(to_remove, len(idle_instances))):
                self.bots[bot_type].remove(idle_instances[i])
            return True
        
        return False
    
    def pause_bot(self, bot_type: str) -> bool:
        """Pause all instances of a bot"""
        if bot_type not in self.bots:
            return False
        for bot in self.bots[bot_type]:
            bot.status = "idle"
        return True
    
    def resume_bot(self, bot_type: str) -> bool:
        """Resume all instances of a bot"""
        if bot_type not in self.bots:
            return False
        for bot in self.bots[bot_type]:
            if bot.status == "idle":
                bot.status = "active"
        return True
    
    def auto_scale(self):
        """Automatically scale bots based on load"""
        if not self.auto_mode:
            return
        
        for bot_type, config in self.bot_configs.items():
            instances = self.bots.get(bot_type, [])
            if not instances:
                continue
            
            avg_load = sum(b.load_percentage for b in instances) / len(instances)
            target_load = config["target_load"]
            current_count = len(instances)
            max_count = config["max_instances"]
            
            # Scale up if load is high
            if avg_load > target_load + 10 and current_count < max_count:
                self.scale_bot(bot_type, current_count + 1)
            
            # Scale down if load is low
            elif avg_load < target_load - 20 and current_count > 1:
                self.scale_bot(bot_type, current_count - 1)
    
    async def process_job(self, job: Dict):
        """Process a job with appropriate bot"""
        service_id = job.get("service_id")
        bot_type = self._get_bot_for_service(service_id)
        
        if not bot_type or bot_type not in self.bots:
            return {"success": False, "error": "No bot available for this service"}
        
        # Use lock to prevent race conditions
        async with self.bot_locks.get(bot_type, asyncio.Lock()):
            # Find idle bot instance
            idle_bots = [b for b in self.bots[bot_type] if b.status == "idle"]
            if not idle_bots:
                # All bots busy, try to scale
                if self.auto_mode:
                    self.auto_scale()
                return {"success": False, "error": "All bots busy, job queued"}
            
            bot = idle_bots[0]
            bot.status = "active"
            bot.last_active = datetime.now()
        
        try:
            # Execute job (in real implementation, call actual bot)
            start_time = time.time()
            result = await self._execute_bot_job(bot, job)
            execution_time = time.time() - start_time
            
            # Update bot metrics with lock
            async with self.bot_locks.get(bot_type, asyncio.Lock()):
                bot.jobs_completed += 1
                bot.avg_execution_time = (bot.avg_execution_time * (bot.jobs_completed - 1) + execution_time) / bot.jobs_completed
                bot.status = "idle"
            
            return result
        except Exception as e:
            async with self.bot_locks.get(bot_type, asyncio.Lock()):
                bot.jobs_failed += 1
                bot.status = "error"
            return {"success": False, "error": str(e)}
    
    def _get_bot_for_service(self, service_id: str) -> Optional[str]:
        """Map service to bot type"""
        mapping = {
            "svc_lead_generation": "lead_generation",
            "svc_crm_intake": "crm_intake",
            "svc_crm_scoring": "crm_scoring",
            "svc_flyer_production": "flyer_production",
            "svc_outreach": "outreach"
        }
        return mapping.get(service_id)
    
    async def _execute_bot_job(self, bot: BotInstance, job: Dict) -> Dict:
        """Execute job on bot (placeholder for actual bot execution)"""
        # Simulate bot execution
        await asyncio.sleep(1)
        return {"success": True, "result": "Job completed"}
    
    async def start(self):
        """Start the orchestrator"""
        self.running = True
        while self.running:
            # Auto-scale check
            self.auto_scale()
            await asyncio.sleep(10)
    
    def stop(self):
        """Stop the orchestrator"""
        self.running = False

# Global orchestrator instance
orchestrator = BotOrchestrator()
