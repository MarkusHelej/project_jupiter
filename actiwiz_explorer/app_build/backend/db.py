import sqlite3
import os
import pandas as pd
import numpy as np

DB_DIR = "apps/actiwiz_explorer/backend/data/db"
DB_PATH = os.path.join(DB_DIR, "app.db")

def _get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    print("[BACKEND_START] Initializing Database")
    conn = _get_db()
    try:
        # Create Tables
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                id INTEGER PRIMARY KEY,
                machine TEXT,
                position TEXT,
                activation_index REAL,
                mass_kg REAL,
                material TEXT,
                "group" TEXT,
                beam_p_s REAL,
                energy_GeV REAL,
                irradiation_y REAL,
                waiting_y REAL
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS activation_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER,
                total_activity_Bq_g REAL,
                IRAS REAL,
                LL REAL,
                Co_60_eq REAL,
                DR_10cm_uSv_h REAL,
                DR_40cm_uSv_h REAL,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
            )
        """)
        
        conn.execute("""
            CREATE TABLE IF NOT EXISTS nuclides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario_id INTEGER,
                nuclide_name TEXT,
                activity_Bq_g REAL,
                FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
            )
        """)
        
        # Check if already populated
        count = conn.execute("SELECT COUNT(*) FROM scenarios").fetchone()[0]
        if count > 0:
            print(f"[BACKEND_STEP] Database already contains {count} scenarios. Skipping ingestion.")
            return

        # Ingest Scenarios
        scn_path = "Jupyter_pyviz_module/data/reproduce_sherpa_scn.csv"
        if os.path.exists(scn_path):
            print(f"[BACKEND_STEP] Ingesting scenarios from {scn_path}")
            df_scn = pd.read_csv(scn_path)
            # Map columns to schema
            df_scn_subset = df_scn[['scenario_id', 'machine', 'position', 'activation_index', 'mass_kg', 'material', 'group', 'beam_p_s', 'energy_GeV', 'irradiation_y', 'waiting_y']].copy()
            df_scn_subset.rename(columns={'scenario_id': 'id'}, inplace=True)
            df_scn_subset.to_sql('scenarios', conn, if_exists='append', index=False)
            print(f"[BACKEND_STEP] Ingested {len(df_scn_subset)} scenarios")

        # Ingest Detailed Results and Nuclides
        itm_path = "Jupyter_pyviz_module/data/study_TFA_itm.csv"
        if os.path.exists(itm_path):
            print(f"[BACKEND_STEP] Ingesting activation results and nuclides from {itm_path}")
            # We use chunks to handle potential large files
            chunk_size = 10000
            for chunk in pd.read_csv(itm_path, chunksize=chunk_size):
                # Activation Results
                res_cols = ['scenario_id', 'total_activity_Bq_g', 'IRAS', 'LL', 'Co-60_eq', 'DR_10cm_uSv_h', 'DR_40cm_uSv_h']
                # Check which columns exist in chunk
                existing_res_cols = [c for c in res_cols if c in chunk.columns]
                df_res = chunk[existing_res_cols].copy()
                if 'Co-60_eq' in df_res.columns:
                    df_res.rename(columns={'Co-60_eq': 'Co_60_eq'}, inplace=True)
                df_res.to_sql('activation_results', conn, if_exists='append', index=False)
                
                # Nuclides - Identify columns that look like nuclides (e.g. Ag-108m, Co-60)
                # From head, nuclides start after total_activity_Bq_g or similar.
                # Let's find columns that have a hyphen and end with a number/m
                import re
                nuclide_pattern = re.compile(r'^[A-Z][a-z]?-[0-9]+m?$')
                nuc_cols = [c for c in chunk.columns if nuclide_pattern.match(c)]
                
                nuc_data = []
                for _, row in chunk.iterrows():
                    sid = row['scenario_id']
                    for nuc in nuc_cols:
                        val = row[nuc]
                        if val > 0:
                            nuc_data.append({'scenario_id': sid, 'nuclide_name': nuc, 'activity_Bq_g': val})
                
                if nuc_data:
                    pd.DataFrame(nuc_data).to_sql('nuclides', conn, if_exists='append', index=False)
            
            print("[BACKEND_STEP] Ingestion of activation results and nuclides complete")

        conn.commit()
        print("[BACKEND_SUCCESS] Database initialization complete")
    except Exception as e:
        print(f"[BACKEND_ERROR] Database initialization failed: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
