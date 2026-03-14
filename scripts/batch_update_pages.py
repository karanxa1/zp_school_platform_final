import os
import re

PAGE_DIR = '/Users/macbook/anuj/zp_school_platform/frontend/src/pages'

pages_to_api = {
    'AcademicsList.tsx': ('classes', '/academics/classes/'),
    'ExamsList.tsx': ('exams', '/exams/'),
    'FeesList.tsx': ('fees', '/fees/'),
    'HomeworkList.tsx': ('homework', '/homework/'),
    'LogisticsList.tsx': ('logistics', '/logistics/inventory/'),
    'CommunicationList.tsx': ('messages', '/communication/messages/'),
}

for filename, (state_var, api_route) in pages_to_api.items():
    filepath = os.path.join(PAGE_DIR, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    # 1. Add import for useApi
    if 'useApi' not in content:
        content = content.replace("import { Table,", "import { useApi } from '../hooks/useApi';\nimport { Table,")
        
    # 2. Add useApi hook inside the component
    hook_str = f"const {{ fetchApi, loading, error }} = useApi();"
    # Try replacing the local loading variable with the destructured one
    content = re.sub(r'const \[loading,\s*setLoading\]\s*=\s*useState\(true\);', hook_str, content)
    
    # 3. Replace setTimeout mock fetch with real fetchApi
    mock_fetch_pattern = r'// Dummy fetch for now\s*useEffect\(\(\)\s*=>\s*\{.*?\},\s*\[\]\);'
    
    real_fetch = f"""useEffect(() => {{
    fetchApi('{api_route}')
      .then(data => set{state_var.capitalize()}(data))
      .catch(err => console.error("Failed to load:", err));
  }}, [fetchApi]);"""
    
    content = re.sub(mock_fetch_pattern, real_fetch, content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Bulk replacement complete!")
