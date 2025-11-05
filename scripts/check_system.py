#!/usr/bin/env python3
"""
VRabater システムチェッカー
環境が正しくセットアップされているかを自動チェックします
"""

import sys
import subprocess
import os
from pathlib import Path

# カラー出力用
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_check(message, status):
    """チェック結果を整形して表示"""
    icon = f"{Colors.GREEN}✅{Colors.RESET}" if status else f"{Colors.RED}❌{Colors.RESET}"
    print(f"{icon} {message}")

def print_header(text):
    """セクションヘッダーを表示"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def check_command(cmd, name, min_version=None):
    """コマンドの存在確認とバージョンチェック"""
    try:
        result = subprocess.run([cmd, '--version'], 
                              capture_output=True, 
                              text=True, 
                              timeout=5)
        version = result.stdout.split('\n')[0] if result.returncode == 0 else None
        if version:
            print_check(f"{name} インストール済み: {version}", True)
            return True
        else:
            print_check(f"{name} が見つかりません", False)
            return False
    except FileNotFoundError:
        print_check(f"{name} が見つかりません", False)
        print(f"   {Colors.YELLOW}→ インストール方法: {get_install_url(name)}{Colors.RESET}")
        return False
    except Exception as e:
        print_check(f"{name} チェックエラー: {e}", False)
        return False

def get_install_url(name):
    """インストールURLを返す"""
    urls = {
        'Node.js': 'https://nodejs.org/',
        'Python': 'https://www.python.org/',
        'Ollama': 'https://ollama.ai/',
        'Git': 'https://git-scm.com/',
    }
    return urls.get(name, '')

def check_file_exists(path, name):
    """ファイルの存在確認"""
    exists = Path(path).exists()
    print_check(f"{name}: {path}", exists)
    if not exists:
        print(f"   {Colors.YELLOW}→ ファイルを配置してください{Colors.RESET}")
    return exists

def check_directory_exists(path, name):
    """ディレクトリの存在確認"""
    exists = Path(path).is_dir()
    print_check(f"{name}: {path}", exists)
    return exists

def check_npm_packages(package_json_path):
    """package.jsonとnode_modulesの確認"""
    package_exists = Path(package_json_path).exists()
    node_modules_exists = Path(package_json_path).parent / 'node_modules'
    
    print_check(f"package.json: {package_json_path}", package_exists)
    
    if package_exists:
        modules_exists = node_modules_exists.exists()
        print_check(f"node_modules: {node_modules_exists}", modules_exists)
        
        if not modules_exists:
            print(f"   {Colors.YELLOW}→ npm install を実行してください{Colors.RESET}")
        
        return modules_exists
    return False

def check_ollama_models():
    """Ollamaモデルの確認"""
    try:
        result = subprocess.run(['ollama', 'list'], 
                              capture_output=True, 
                              text=True, 
                              timeout=10)
        
        if result.returncode == 0:
            models = result.stdout
            has_qwen = 'qwen2.5:3b' in models.lower()
            
            print_check("Ollamaモデルリスト取得成功", True)
            print(f"\n{Colors.BLUE}インストール済みモデル:{Colors.RESET}")
            print(models)
            
            print_check("推奨モデル (qwen2.5:3b-instruct-q4_K_M)", has_qwen)
            
            if not has_qwen:
                print(f"   {Colors.YELLOW}→ ollama pull qwen2.5:3b-instruct-q4_K_M{Colors.RESET}")
            
            return has_qwen
        else:
            print_check("Ollamaが起動していません", False)
            print(f"   {Colors.YELLOW}→ ollama serve で起動してください{Colors.RESET}")
            return False
            
    except Exception as e:
        print_check(f"Ollamaチェックエラー: {e}", False)
        return False

def main():
    """メインチェック処理"""
    print(f"{Colors.BOLD}{Colors.GREEN}")
    print("╔════════════════════════════════════════╗")
    print("║  VRabater システムチェッカー           ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}\n")
    
    results = {}
    
    # 1. 必須ソフトウェア
    print_header("1. 必須ソフトウェアのチェック")
    results['node'] = check_command('node', 'Node.js')
    results['python'] = check_command('python', 'Python')
    results['ollama'] = check_command('ollama', 'Ollama')
    results['git'] = check_command('git', 'Git (オプション)')
    
    # 2. プロジェクト構造
    print_header("2. プロジェクト構造のチェック")
    base_path = Path.cwd()
    
    results['package_root'] = check_file_exists(base_path / 'package.json', 'ルートpackage.json')
    results['readme'] = check_file_exists(base_path / 'README.md', 'README.md')
    
    # 3. 依存関係
    print_header("3. 依存関係のチェック")
    results['web_packages'] = check_npm_packages(base_path / 'apps' / 'web' / 'package.json')
    results['gateway_packages'] = check_npm_packages(base_path / 'apps' / 'gateway' / 'package.json')
    
    requirements_path = base_path / 'apps' / 'ai' / 'requirements.txt'
    results['requirements'] = check_file_exists(requirements_path, 'Python requirements.txt')
    
    # 4. モデルとアセット
    print_header("4. モデルとアセットのチェック")
    
    vrm_path = base_path / 'assets' / 'vrm' / 'hakusan_avatar.vrm'
    results['vrm'] = check_file_exists(vrm_path, 'VRMモデル')
    
    hdri_path = base_path / 'assets' / 'hdris'
    results['hdri_dir'] = check_directory_exists(hdri_path, 'HDRIディレクトリ')
    
    # 5. Ollamaモデル
    print_header("5. Ollamaモデルのチェック")
    results['ollama_model'] = check_ollama_models()
    
    # 6. サマリー
    print_header("6. チェック結果サマリー")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed
    
    print(f"総チェック項目: {total}")
    print(f"{Colors.GREEN}✅ 成功: {passed}{Colors.RESET}")
    print(f"{Colors.RED}❌ 失敗: {failed}{Colors.RESET}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 すべてのチェックが完了しました！{Colors.RESET}")
        print(f"{Colors.GREEN}起動準備が整っています。{Colors.RESET}\n")
        print(f"次のステップ:")
        print(f"  1. .\\scripts\\start_all.ps1 を実行")
        print(f"  2. http://localhost:5173 にアクセス")
        return 0
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️ いくつかの項目が完了していません{Colors.RESET}")
        print(f"{Colors.YELLOW}上記のエラーを修正してから再度チェックしてください{Colors.RESET}\n")
        print(f"詳細な手順: SETUP.md を参照")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}チェックを中断しました{Colors.RESET}")
        sys.exit(1)
