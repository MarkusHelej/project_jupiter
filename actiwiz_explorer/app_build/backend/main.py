import sqlite3
import os
from apps.actiwiz_explorer.backend.db import _get_db, init_db

# Initialize database on module load
init_db()

def get_stats():
    print("[BACKEND_START] get_stats")
    conn = _get_db()
    try:
        stats = {}
        # Machine count
        stats['machine_count'] = conn.execute("SELECT COUNT(DISTINCT machine) FROM scenarios").fetchone()[0]
        # Total scenarios
        stats['scenario_count'] = conn.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
        # Average activation index
        stats['avg_activation_index'] = conn.execute("SELECT AVG(activation_index) FROM scenarios").fetchone()[0]
        # Max dose rate
        stats['max_dr_10cm'] = conn.execute("SELECT MAX(DR_10cm_uSv_h) FROM activation_results").fetchone()[0]
        
        print(f"[BACKEND_SUCCESS] get_stats: {stats}")
        return stats
    except Exception as e:
        print(f"[BACKEND_ERROR] get_stats failed: {str(e)}")
        raise
    finally:
        conn.close()

def get_scenarios(filters: dict = None, limit: int = 50):
    print(f"[BACKEND_START] get_scenarios with filters={filters}, limit={limit}")
    conn = _get_db()
    try:
        query = """
            SELECT s.*, ar.total_activity_Bq_g, ar.IRAS, ar.LL, ar.Co_60_eq, ar.DR_10cm_uSv_h, ar.DR_40cm_uSv_h
            FROM scenarios s
            LEFT JOIN activation_results ar ON s.id = ar.scenario_id
            WHERE 1=1
        """
        params = []
        if filters:
            if filters.get('machine'):
                query += " AND s.machine = ?"
                params.append(filters['machine'])
            if filters.get('position'):
                query += " AND s.position = ?"
                params.append(filters['position'])
            if filters.get('material'):
                query += " AND s.material = ?"
                params.append(filters['material'])
        
        query += " LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        result = [dict(r) for r in rows]
        print(f"[BACKEND_SUCCESS] get_scenarios returned {len(result)} records")
        return result
    except Exception as e:
        print(f"[BACKEND_ERROR] get_scenarios failed: {str(e)}")
        raise
    finally:
        conn.close()

def get_activation_distribution(metric: str = 'activation_index'):
    print(f"[BACKEND_START] get_activation_distribution for metric={metric}")
    conn = _get_db()
    try:
        # Check if metric is in scenarios or activation_results
        if metric in ['activation_index', 'mass_kg', 'energy_GeV']:
            table = 'scenarios'
        else:
            table = 'activation_results'
            # Map frontend names to backend names if needed
            if metric == 'Co-60_eq':
                metric = 'Co_60_eq'
        
        query = f"SELECT {metric} as value FROM {table} WHERE {metric} IS NOT NULL"
        rows = conn.execute(query).fetchall()
        result = [dict(r) for r in rows]
        print(f"[BACKEND_SUCCESS] get_activation_distribution returned {len(result)} records")
        return result
    except Exception as e:
        print(f"[BACKEND_ERROR] get_activation_distribution failed: {str(e)}")
        raise
    finally:
        conn.close()

def get_machine_comparison():
    print("[BACKEND_START] get_machine_comparison")
    conn = _get_db()
    try:
        query = """
            SELECT s.machine, 
                   AVG(s.activation_index) as avg_activation_index,
                   AVG(ar.total_activity_Bq_g) as avg_activity,
                   AVG(ar.DR_10cm_uSv_h) as avg_dr_10cm
            FROM scenarios s
            JOIN activation_results ar ON s.id = ar.scenario_id
            GROUP BY s.machine
        """
        rows = conn.execute(query).fetchall()
        result = [dict(r) for r in rows]
        print(f"[BACKEND_SUCCESS] get_machine_comparison returned {len(result)} records")
        return result
    except Exception as e:
        print(f"[BACKEND_ERROR] get_machine_comparison failed: {str(e)}")
        raise
    finally:
        conn.close()

def get_nuclide_breakdown(scenario_id: int):
    print(f"[BACKEND_START] get_nuclide_breakdown for scenario_id={scenario_id}")
    conn = _get_db()
    try:
        query = """
            SELECT nuclide_name, activity_Bq_g
            FROM nuclides
            WHERE scenario_id = ?
            ORDER BY activity_Bq_g DESC
            LIMIT 10
        """
        rows = conn.execute(query, (scenario_id,)).fetchall()
        result = [dict(r) for r in rows]
        print(f"[BACKEND_SUCCESS] get_nuclide_breakdown returned {len(result)} records")
        return result
    except Exception as e:
        print(f"[BACKEND_ERROR] get_nuclide_breakdown failed: {str(e)}")
        raise
    finally:
        conn.close()

__all__ = ["get_stats", "get_scenarios", "get_activation_distribution", "get_machine_comparison", "get_nuclide_breakdown"]
