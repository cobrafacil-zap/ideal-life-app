#!/usr/bin/env python3
"""
Script para gerar imagens de crianças com super-heróis usando os prompts do PDF.

Este script:
1. Extrai os prompts do PDF "Pack_50_Personagens_IA_PT_COM_ROSTOS_PESSOA (1).pdf"
2. Usa a API do DALL-E (OpenAI) para gerar as imagens
3. Salva as imagens em uma pasta de saída

Requisitos:
- Python 3.7+
- Biblioteca PyMuPDF (fitz) para ler o PDF
- Biblioteca openai para gerar imagens
- API key da OpenAI configurada

Uso:
    python generate_superhero_images.py --api-key SUA_CHAVE_API --output-dir ./superherois

Ou configure a variável de ambiente OPENAI_API_KEY:
    export OPENAI_API_KEY=sua_chave_aqui
    python generate_superhero_images.py
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from typing import List, Dict, Optional

# Tenta importar as bibliotecas necessárias
try:
    import fitz  # PyMuPDF
except ImportError:
    print("❌ Erro: PyMuPDF não está instalado.")
    print("   Instale com: pip install PyMuPDF")
    sys.exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("❌ Erro: openai não está instalado.")
    print("   Instale com: pip install openai")
    sys.exit(1)


def extrair_prompts_do_pdf(caminho_pdf: str) -> List[Dict[str, str]]:
    """
    Extrai os prompts completos do PDF.
    
    Returns:
        Lista de dicionários com 'numero', 'personagem' e 'prompt'
    """
    doc = fitz.open(caminho_pdf)
    prompts = []
    
    for page_num, page in enumerate(doc):
        text = page.get_text()
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            if 'PROMPT PRONTO - COPIE TUDO:' in line:
                # Extrai o prompt completo (até encontrar "DICA PRO:")
                prompt_lines = []
                for j in range(i, min(i + 30, len(lines))):
                    prompt_lines.append(lines[j])
                    if 'DICA PRO:' in lines[j]:
                        break
                
                prompt_completo = '\n'.join(prompt_lines)
                
                # Tenta extrair o nome do personagem do prompt
                personagem = "Desconhecido"
                # Procura por "original [nome]-inspired" ou "original [nome] inspired"
                match = re.search(r'original\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+inspired|\s*-\s*inspired)', prompt_completo)
                if match:
                    personagem = match.group(1).strip()
                    # Remove "small" que pode aparecer em alguns casos
                    personagem = re.sub(r'^small\s+', '', personagem, flags=re.IGNORECASE)
                    # Remove hífens extras
                    personagem = personagem.replace('-', ' ').strip()
                    # Limpa espaços extras
                    personagem = ' '.join(personagem.split())
                
                # Se não encontrou, tenta outra abordagem
                if personagem == "Desconhecido":
                    # Procura por "as an original [nome]-inspired"
                    match = re.search(r'as an original\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+inspired|\s*-\s*inspired)', prompt_completo)
                    if match:
                        personagem = match.group(1).strip()
                        personagem = re.sub(r'^small\s+', '', personagem, flags=re.IGNORECASE)
                        personagem = personagem.replace('-', ' ').strip()
                        personagem = ' '.join(personagem.split())
                
                # Se ainda não encontrou, tenta extrair do título da página
                if personagem == "Desconhecido":
                    # Procura por "PERSONAGEM • CINEMATOGRÁFICO" e pega a próxima linha
                    match = re.search(r'PERSONAGEM • CINEMATOGRÁFICO\s*\n([^\n]+)', text)
                    if match:
                        personagem = match.group(1).strip()
                        # Remove " - Versão Cinematográfica Original"
                        personagem = re.sub(r'\s*-\s*Versão Cinematográfica Original\s*$', '', personagem)
                
                # Tenta extrair o número do prompt
                numero = len(prompts) + 1
                
                prompts.append({
                    'numero': numero,
                    'personagem': personagem,
                    'prompt': prompt_completo
                })
    
    doc.close()
    return prompts


def gerar_imagem_dalle(client: OpenAI, prompt: str, output_path: str, tamanho: str = "1024x1024") -> bool:
    """
    Gera uma imagem usando a API do DALL-E.
    
    Args:
        client: Cliente OpenAI
        prompt: Prompt para geração da imagem
        output_path: Caminho para salvar a imagem
        tamanho: Tamanho da imagem (1024x1024, 512x512, etc.)
    
    Returns:
        True se a imagem foi gerada com sucesso, False caso contrário
    """
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=tamanho,
            quality="standard",
            n=1,
        )
        
        # Baixa a imagem
        image_url = response.data[0].url
        
        # Usa requests para baixar a imagem
        import requests
        response = requests.get(image_url)
        response.raise_for_status()
        
        # Salva a imagem
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        return True
    
    except Exception as e:
        print(f"   ⚠️  Erro ao gerar imagem: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Gera imagens de crianças com super-heróis usando prompts do PDF'
    )
    parser.add_argument(
        '--pdf',
        default='/Users/pcs/Downloads/Pack_50_Personagens_IA_PT_COM_ROSTOS_PESSOA (1).pdf',
        help='Caminho para o arquivo PDF'
    )
    parser.add_argument(
        '--output-dir',
        default='./superherois',
        help='Pasta de saída para as imagens'
    )
    parser.add_argument(
        '--api-key',
        default=None,
        help='API key da OpenAI (ou use a variável de ambiente OPENAI_API_KEY)'
    )
    parser.add_argument(
        '--tamanho',
        default='1024x1024',
        choices=['1024x1024', '512x512', '1792x1024', '1024x1792'],
        help='Tamanho das imagens'
    )
    parser.add_argument(
        '--limite',
        type=int,
        default=None,
        help='Limitar o número de imagens a gerar (para testes)'
    )
    
    args = parser.parse_args()
    
    # Verifica se o PDF existe
    if not os.path.exists(args.pdf):
        print(f"❌ Erro: PDF não encontrado: {args.pdf}")
        sys.exit(1)
    
    # Configura a API key
    api_key = args.api_key or os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("❌ Erro: API key da OpenAI não fornecida.")
        print("   Use --api-key ou configure a variável de ambiente OPENAI_API_KEY")
        sys.exit(1)
    
    # Cria a pasta de saída
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Extrai os prompts do PDF
    print(f"📖 Extraindo prompts do PDF: {args.pdf}")
    prompts = extrair_prompts_do_pdf(args.pdf)
    print(f"✅ {len(prompts)} prompts extraídos com sucesso!\n")
    
    # Limita o número de imagens se solicitado
    if args.limite:
        prompts = prompts[:args.limite]
        print(f"⚠️  Limitando a {args.limite} imagens\n")
    
    # Inicializa o cliente OpenAI
    client = OpenAI(api_key=api_key)
    
    # Gera as imagens
    print(f"🎨 Gerando {len(prompts)} imagens...\n")
    
    resultados = []
    for i, item in enumerate(prompts, 1):
        numero = item['numero']
        personagem = item['personagem']
        prompt = item['prompt']
        
        # Nome do arquivo
        nome_arquivo = f"{numero:02d}_{personagem.replace(' ', '_').lower()}.png"
        output_path = output_dir / nome_arquivo
        
        print(f"[{i}/{len(prompts)}] Gerando: {personagem}...")
        
        # Gera a imagem
        sucesso = gerar_imagem_dalle(client, prompt, str(output_path), args.tamanho)
        
        if sucesso:
            print(f"   ✅ Salvo em: {output_path}")
            resultados.append({
                'numero': numero,
                'personagem': personagem,
                'arquivo': str(output_path),
                'prompt': prompt,
                'sucesso': True
            })
        else:
            resultados.append({
                'numero': numero,
                'personagem': personagem,
                'arquivo': None,
                'prompt': prompt,
                'sucesso': False
            })
        
        print()
    
    # Salva um resumo em JSON
    resumo_path = output_dir / 'resumo.json'
    with open(resumo_path, 'w', encoding='utf-8') as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)
    
    # Estatísticas
    total = len(resultados)
    sucesso = sum(1 for r in resultados if r['sucesso'])
    falha = total - sucesso
    
    print("=" * 60)
    print("📊 RESUMO")
    print("=" * 60)
    print(f"Total de prompts: {total}")
    print(f"Imagens geradas: {sucesso} ✅")
    print(f"Falhas: {falha} ❌")
    print(f"\n📁 Imagens salvas em: {output_dir.absolute()}")
    print(f"📄 Resumo salvo em: {resumo_path}")
    print("=" * 60)


if __name__ == '__main__':
    main()
