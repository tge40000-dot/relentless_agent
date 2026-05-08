"""
24/7 Monitoring System
Monitors system health, prevents hallucination, ensures 100% capacity
"""

import asyncio
import requests
import time
from datetime import datetime
from typing import Dict, List
from hallucination_prevention import HallucinationPreventer

class Monitor24_7:
    def __init__(self):
        self.job_manager_url = "http://127.0.0.1:8001"
        self.dashboard_url = "http://127.0.0.1:8002"
        self.agent_url = "http://127.0.0.1:8000"
        self.preventer = HallucinationPreventer()
        
        self.alerts = []
        self.metrics_history = []
        self.last_check = None
        
        # Thresholds
        self.thresholds = {
            "cpu_usage": 90,
            "memory_usage": 90,
            "queue_size": 20,
            "error_rate": 5,
            "bot_load": 85
        }
    
    async def start_monitoring(self):
        """Start 24/7 monitoring loop"""
        print("🚀 Starting 24/7 Monitoring System...")
        print("📡 Monitoring all systems for optimal performance")
        print("🛡️  Hallucination prevention active")
        print("")
        
        while True:
            try:
                await self._check_cycle()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                print(f"⚠️  Monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def _check_cycle(self):
        """Run one monitoring cycle"""
        timestamp = datetime.now()
        print(f"\n🕐 Check Cycle: {timestamp.strftime('%H:%M:%S')}")
        
        # Check all systems
        health_status = await self._check_system_health()
        metrics_status = await self._check_system_metrics()
        bot_status = await self._check_bot_status()
        job_status = await self._check_job_status()
        hallucination_status = await self._check_hallucination_risks()
        
        # Aggregate status
        overall_status = "healthy"
        if not health_status["healthy"]:
            overall_status = "unhealthy"
        if not metrics_status["healthy"]:
            overall_status = "degraded"
        if not bot_status["healthy"]:
            overall_status = "degraded"
        if not job_status["healthy"]:
            overall_status = "degraded"
        if hallucination_status["risks"] > 0:
            overall_status = "warning"
        
        # Log metrics
        self._log_metrics({
            "timestamp": timestamp.isoformat(),
            "health": health_status,
            "metrics": metrics_status,
            "bots": bot_status,
            "jobs": job_status,
            "hallucination": hallucination_status,
            "overall": overall_status
        })
        
        # Send alerts if needed
        if overall_status != "healthy":
            await self._send_alert(overall_status, {
                "health": health_status,
                "metrics": metrics_status,
                "bots": bot_status,
                "jobs": job_status
            })
        
        # Auto-heal if possible
        if overall_status in ["degraded", "unhealthy"]:
            await self._auto_heal()
        
        print(f"✓ Cycle complete - Status: {overall_status.upper()}")
        self.last_check = timestamp
    
    async def _check_system_health(self) -> Dict:
        """Check health of all services"""
        print("  🔍 Checking system health...")
        
        services = {
            "Job Manager": self.job_manager_url,
            "Dashboard": self.dashboard_url,
            "Agent": self.agent_url
        }
        
        results = {}
        all_healthy = True
        
        for name, url in services.items():
            try:
                health_endpoint = f"{url}/health" if name != "Dashboard" else url
                response = requests.get(health_endpoint, timeout=5)
                results[name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_time": response.elapsed.total_seconds()
                }
                if response.status_code != 200:
                    all_healthy = False
            except Exception as e:
                results[name] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                all_healthy = False
        
        print(f"    Services: {sum(1 for r in results.values() if r['status'] == 'healthy')}/{len(results)} healthy")
        return {"healthy": all_healthy, "services": results}
    
    async def _check_system_metrics(self) -> Dict:
        """Check system metrics against thresholds"""
        print("  📊 Checking system metrics...")
        
        try:
            response = requests.get(f"{self.job_manager_url}/metrics", timeout=5)
            data = response.json()
            
            issues = []
            
            # Parse CPU
            cpu = float(data.get("cpu_usage", "0%").replace("%", ""))
            if cpu > self.thresholds["cpu_usage"]:
                issues.append(f"High CPU: {cpu}%")
            
            # Parse memory
            memory = float(data.get("memory_percent", "0%").replace("%", ""))
            if memory > self.thresholds["memory_usage"]:
                issues.append(f"High Memory: {memory}%")
            
            # Check queue
            queue = data.get("queue_size", 0)
            if queue > self.thresholds["queue_size"]:
                issues.append(f"High Queue: {queue}")
            
            # Check errors
            errors = data.get("errors_24h", 0)
            if errors > self.thresholds["error_rate"]:
                issues.append(f"High Errors: {errors}")
            
            healthy = len(issues) == 0
            
            if issues:
                print(f"    Issues: {', '.join(issues)}")
            else:
                print(f"    All metrics within thresholds")
            
            return {
                "healthy": healthy,
                "issues": issues,
                "metrics": data
            }
        except Exception as e:
            print(f"    Error checking metrics: {e}")
            return {"healthy": False, "error": str(e)}
    
    async def _check_bot_status(self) -> Dict:
        """Check bot status and load"""
        print("  🤖 Checking bot status...")
        
        try:
            response = requests.get(f"{self.job_manager_url}/bots", timeout=5)
            data = response.json()
            
            issues = []
            overloaded_bots = []
            
            for bot_type, stats in data.items():
                avg_load = stats.get("avg_load", 0)
                if avg_load > self.thresholds["bot_load"]:
                    overloaded_bots.append(bot_type)
                    issues.append(f"{bot_type}: {avg_load}% load")
            
            healthy = len(overloaded_bots) == 0
            
            if overloaded_bots:
                print(f"    Overloaded: {', '.join(overloaded_bots)}")
            else:
                print(f"    All bots operating normally")
            
            return {
                "healthy": healthy,
                "issues": issues,
                "bots": data
            }
        except Exception as e:
            print(f"    Error checking bots: {e}")
            return {"healthy": False, "error": str(e)}
    
    async def _check_job_status(self) -> Dict:
        """Check job queue and processing"""
        print("  📋 Checking job status...")
        
        try:
            # Check pending jobs
            pending_response = requests.get(f"{self.job_manager_url}/jobs/status/pending", timeout=5)
            pending_data = pending_response.json()
            pending_count = len(pending_data.get("jobs", []))
            
            # Check failed jobs
            failed_response = requests.get(f"{self.job_manager_url}/jobs/status/failed", timeout=5)
            failed_data = failed_response.json()
            failed_count = len(failed_data.get("jobs", []))
            
            issues = []
            if pending_count > 10:
                issues.append(f"High pending: {pending_count}")
            if failed_count > 3:
                issues.append(f"High failed: {failed_count}")
            
            healthy = len(issues) == 0
            
            print(f"    Pending: {pending_count}, Failed: {failed_count}")
            
            return {
                "healthy": healthy,
                "issues": issues,
                "pending": pending_count,
                "failed": failed_count
            }
        except Exception as e:
            print(f"    Error checking jobs: {e}")
            return {"healthy": False, "error": str(e)}
    
    async def _check_hallucination_risks(self) -> Dict:
        """Check for potential AI hallucination risks"""
        print("  🛡️  Checking hallucination risks...")
        
        risks = 0
        
        # Check recent job outputs for hallucination
        try:
            response = requests.get(f"{self.job_manager_url}/jobs", timeout=5)
            data = response.json()
            jobs = data.get("jobs", [])[:10]  # Check last 10 jobs
            
            for job in jobs:
                bot_output = job.get("bot_output", {})
                if bot_output:
                    # Check for hallucination indicators
                    result = bot_output.get("result", "")
                    is_hallucination, reason = self.preventer.detect_hallucination(str(result))
                    if is_hallucination:
                        risks += 1
                        print(f"    ⚠️  Potential hallucination: {reason}")
        except Exception as e:
            print(f"    Error checking hallucination: {e}")
        
        if risks == 0:
            print(f"    No hallucination risks detected")
        
        return {
            "risks": risks,
            "status": "safe" if risks == 0 else "warning"
        }
    
    def _log_metrics(self, metrics: Dict):
        """Log metrics to history"""
        self.metrics_history.append(metrics)
        
        # Keep only last 1000 entries
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-1000:]
    
    async def _send_alert(self, status: str, details: Dict):
        """Send alert notification"""
        print(f"  🚨 ALERT: {status.upper()}")
        
        # Log alert
        alert = {
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "details": details
        }
        self.alerts.append(alert)
        
        # In production, this would send SMS/email
        print(f"    Alert logged: {len(self.alerts)} total alerts")
    
    async def _auto_heal(self):
        """Attempt to auto-heal degraded systems"""
        print("  🔧 Attempting auto-heal...")
        
        # Auto-scale overloaded bots
        try:
            response = requests.get(f"{self.job_manager_url}/bots", timeout=5)
            data = response.json()
            
            for bot_type, stats in data.items():
                avg_load = stats.get("avg_load", 0)
                if avg_load > self.thresholds["bot_load"]:
                    # Scale up
                    scale_cmd = {
                        "command": f"scale {bot_type} 2"
                    }
                    requests.post(f"{self.job_manager_url}/command", json=scale_cmd, timeout=5)
                    print(f"    Scaled up {bot_type}")
        except Exception as e:
            print(f"    Auto-heal failed: {e}")

# Singleton instance
monitor = Monitor24_7()

async def start_24_7_monitoring():
    """Start the 24/7 monitoring system"""
    await monitor.start_monitoring()

if __name__ == "__main__":
    asyncio.run(start_24_7_monitoring())
