import re

file_path = r'c:\Users\drdhs\OneDrive\Documentos\ottoatlas\otto-atlas-web\src\data\mockData.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Troca qualquer bloco hotspots: [...] por hotspots: [], 
# para zerar a sujeira do banco legado que foi desenhado em 1024x1024
text = re.sub(r'hotspots:\s*\[\s*\[.*?\]\s*\],', 'hotspots: [],', text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCESSO: Limpeza Regex Executada")
