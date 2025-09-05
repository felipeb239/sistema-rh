# 🎨 Instruções para Adicionar Logotipo da Empresa

## 📁 Como Adicionar Seu Logotipo

### 1. **Para o Cabeçalho do Sistema (Web)**

1. Prepare sua logo nos formatos:
   - **PNG** ou **SVG** (recomendado)
   - Dimensões ideais: **120x60 pixels**
   - Fundo transparente (recomendado)

2. Substitua o arquivo:
   ```
   public/assets/logo-placeholder.svg
   ```
   
   Por seu logotipo com o nome:
   ```
   public/assets/logo-placeholder.svg  (se for SVG)
   ou
   public/assets/logo-placeholder.png  (se for PNG)
   ```

3. Se usar PNG, atualize o HTML das páginas alterando:
   ```html
   <img src="assets/logo-placeholder.svg" ...>
   ```
   Para:
   ```html
   <img src="assets/logo-placeholder.png" ...>
   ```

### 2. **Para Exportação PDF**

1. Adicione sua logo em formato PNG:
   ```
   public/assets/logo.png
   ```

2. Dimensões recomendadas: **300x150 pixels** (alta resolução)

3. O sistema automaticamente detectará e usará esta logo nos PDFs

### 3. **Para Exportação CSV**

A identificação da empresa no CSV é configurada no código. Para personalizar:

1. Abra o arquivo `server.js`
2. Procure por: `"FOLHA DE PAGAMENTO - SUA EMPRESA"`
3. Substitua por: `"FOLHA DE PAGAMENTO - NOME DA SUA EMPRESA"`

## 🎯 Estrutura de Arquivos

```
public/
├── assets/
│   ├── logo-placeholder.svg  (Logo do cabeçalho web)
│   └── logo.png             (Logo para PDF - adicione este)
```

## ✅ Formatos Suportados

| Uso | Formato | Tamanho Recomendado |
|-----|---------|-------------------|
| **Web (Cabeçalho)** | SVG, PNG | 120x60px |
| **PDF (Holerite)** | PNG | 300x150px |
| **CSV (Texto)** | - | Configurado no código |

## 🔧 Dicas Importantes

- **SVG**: Melhor qualidade, redimensiona sem perder qualidade
- **PNG**: Boa compatibilidade, use fundo transparente
- **Alta resolução**: Para PDF, use imagens maiores (300 DPI)
- **Consistência**: Use as mesmas cores e proporções em todos os formatos

## 🚀 Após Adicionar a Logo

1. Reinicie o servidor:
   ```bash
   npm run dev
   ```

2. Teste as funcionalidades:
   - ✅ Visualizar logo no cabeçalho
   - ✅ Exportar PDF com logo
   - ✅ Exportar CSV com nome da empresa

## 📞 Solução de Problemas

**Logo não aparece no cabeçalho:**
- Verifique se o arquivo está na pasta correta
- Confirme o nome do arquivo
- Recarregue a página (Ctrl+F5)

**Logo não aparece no PDF:**
- Certifique-se que o arquivo é `logo.png`
- Verifique se está na pasta `public/assets/`
- Reinicie o servidor

**Nome da empresa no CSV:**
- Edite o arquivo `server.js`
- Procure por "SUA EMPRESA"
- Substitua pelo nome correto
