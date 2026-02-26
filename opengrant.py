import os
import sys
import json
import asyncio
import time
import random
from typing import Optional, List
from datetime import datetime

# Fix Windows encoding for Unicode
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    import typer
    import questionary
    from rich.console import Console, Group
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.live import Live
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.rule import Rule
    from rich.columns import Columns
    from rich import print as rprint
except ImportError:
    print("Error: Missing dependencies. Run: pip install typer rich questionary")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))

# --- Backend Feature Bridges ---
def get_logic():
    from backend.matcher import run_matching
    from backend.github_api import fetch_repo_data
    from backend.monetization import fetch_live_bounties, generate_monetization_strategy
    from backend.fundability import analyze_fundability
    from backend.time_machine import generate_roadmap
    from backend.portfolio import optimize_portfolio
    from backend.funding_db import FUNDING_SOURCES
    from backend.org_scanner import scan_org
    from backend.funded_dna import compare_repo_to_funded_dna
    from backend.dependency_analyzer import analyze_dependencies
    return {
        "fetch_repo_data": fetch_repo_data,
        "run_matching": run_matching,
        "fetch_live_bounties": fetch_live_bounties,
        "generate_monetization_strategy": generate_monetization_strategy,
        "analyze_fundability": analyze_fundability,
        "generate_roadmap": generate_roadmap,
        "optimize_portfolio": optimize_portfolio,
        "scan_org": scan_org,
        "compare_repo_to_funded_dna": compare_repo_to_funded_dna,
        "analyze_dependencies": analyze_dependencies,
        "funding_sources": FUNDING_SOURCES
    }

app = typer.Typer(help="OpenGrant 2.0 - Developed by Chiranjib")
console = Console()

# --- Aesthetic Assets ---
ASCII_LOGO = """
[bold cyan]  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███╗   ██╗████████╗[/bold cyan]
[bold cyan] ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝[/bold cyan]
[bold blue] ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██████╔╝███████║██╔██╗ ██║   ██║   [/bold blue]
[bold blue] ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║   ██║   [/bold blue]
[bold magenta] ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║ ╚████║   ██║   [/bold magenta]
[bold magenta]  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   [/bold magenta]
"""

def glitch_splash():
    """Hacker-style animated splash screen."""
    os.system('cls' if os.name == 'nt' else 'clear')
    frames = ["[bold cyan]INITIALIZING...[/bold cyan]", "[bold blue]CONNECTING...[/bold blue]", "[bold magenta]OPTIMIZING...[/bold magenta]"]
    for _ in range(3):
        for frame in frames:
            console.print(ASCII_LOGO, justify="center")
            console.print(f"\n[bold green]>>> {frame}[/bold green]", justify="center")
            time.sleep(0.1)
            os.system('cls' if os.name == 'nt' else 'clear')
    
    # Final splash
    console.print(ASCII_LOGO, justify="center")
    console.print("[bold white on blue] THE ULTIMATE OSS FUNDING OS [/bold white on blue]", justify="center")
    console.print("[bold sky_blue]Founder & Lead Architect: Chiranjib[/bold sky_blue]", justify="center")
    console.print("[italic cyan]Designed & Engineered by Chiranjib[/italic cyan]", justify="center")
    console.print("\n" + "="*80 + "\n", style="dim")

def print_header():
    console.print(ASCII_LOGO, justify="center")
    console.print("[bold cyan]Architect & Lead Developer: Chiranjib | v2.0 Pro[/bold cyan]", justify="center")
    console.print("-" * console.width, style="blue dim")

@app.command()
def info():
    """Display information about OpenGrant and its creator."""
    print_header()
    console.print(Panel(
        "[bold white]OpenGrant is an AI-powered funding discovery platform designed to empower OSS developers.[/bold white]\n\n"
        "[bold cyan]Lead Architect & Developer:[/bold cyan] Chiranjib\n"
        "[bold cyan]Mission:[/bold cyan] Decoupling developer income from corporate employment via AI grants matching.\n"
        "[bold cyan]GitHub:[/bold cyan] https://github.com/Chiranjib\n\n"
        "[italic dim]Developed with passion for the global open-source community.[/italic dim]",
        title="[bold magenta]SYSTEM INFO[/bold magenta]",
        border_style="cyan"
    ))

def hacker_typing(text: str, delay: float = 0.01):
    """Prints text with a typing effect."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

# --- Feature Runners ---

def run_dna_scan(url: str):
    logic = get_logic()
    try:
        with Progress(
            SpinnerColumn("dots12"),
            TextColumn("[bold magenta]🧬 Extracting Genetic Repository Markers..."),
            transient=True,
        ) as progress:
            progress.add_task(description="Scanning...", total=None)
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            dna_results = logic["compare_repo_to_funded_dna"](repo_data)

        console.print(Panel(
            f"[bold magenta]GENETIC MATCH SCORE: {dna_results['dna_score']}%[/bold magenta]",
            title="FUNDED DNA ANALYSIS",
            border_style="magenta"
        ))
        
        table = Table(title="TOP SIMILAR FUNDED PROJECTS", border_style="cyan")
        table.add_column("Project", style="bold")
        table.add_column("Similarity", justify="right")
        table.add_column("Historic Funders", style="green")
        
        for m in dna_results["top_matches"]:
            table.add_row(m["project_name"], f"{m['similarity']}%", ", ".join(m["funders"][:2]))
        
        console.print(table)
        console.print("\n[bold yellow]INSIGHTS:[/bold yellow]")
        for insight in dna_results["insights"]:
            console.print(f" > {insight}")
            
    except Exception as e:
        console.print(f"[bold red]DNA Scan Error:[/bold red] {e}")

def run_dependency_scan():
    logic = get_logic()
    try:
        file_path = questionary.text("PATH TO package.json or requirements.txt (blank for current dir):").ask()
        if not file_path:
            if os.path.exists("package.json"): file_path = "package.json"
            elif os.path.exists("requirements.txt"): file_path = "requirements.txt"
        
        if not file_path or not os.path.exists(file_path):
            console.print("[red]Error: File not found.[/red]")
            return

        ecosystem = "npm" if "package.json" in file_path else "pip"
        with open(file_path, "r") as f:
            content = f.read()

        with Progress(
            SpinnerColumn("bouncingBall"),
            TextColumn(f"[bold cyan]📦 Indexing {len(content.splitlines())} Dependencies..."),
            transient=True,
        ) as progress:
            progress.add_task(description="Analyzing...", total=None)
            results = asyncio.run(logic["analyze_dependencies"](content, ecosystem))

        table = Table(title=f"DEPENDENCY FUNDING HEALTH ({ecosystem.upper()})", border_style="cyan")
        table.add_column("Library", style="bold")
        table.add_column("Stars", justify="right")
        table.add_column("Funding Status", style="green")
        
        for r in results:
            status = "[bold green]✓ SPONSORED[/bold green]" if r["has_sponsors"] else "[dim]Unfunded[/dim]"
            table.add_row(r["name"], str(r["stars"]), status)
        
        console.print(table)
    except Exception as e:
        console.print(f"[bold red]Dependency Scan Error:[/bold red] {e}")

def run_roadmap(url: str):
    logic = get_logic()
    try:
        with Progress(
            SpinnerColumn("clock"),
            TextColumn("[bold magenta]⏳ Simulating Temporal Funding Vectors..."),
            transient=True,
        ) as progress:
            progress.add_task(description="Predicting...", total=None)
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
            roadmap = asyncio.run(logic["generate_roadmap"](repo_data, [m['funding'] for m in matches[:3]]))

        console.print(Panel(f"[bold white]90-DAY GROWTH ALPHA: {repo_data['repo_name'].upper()}[/bold white]", subtitle="Strategic Time-Travel Roadmap", border_style="magenta"))
        
        for ms in roadmap.get('milestones', []):
            table = Table(title=f"[bold yellow]STAGE {ms['week']}: {ms['theme'].upper()}[/bold yellow]", show_header=True, header_style="bold magenta", box=None)
            table.add_column("Proposed Action", style="white")
            table.add_column("Expected Impact", style="dim italic")
            for action in ms.get('actions', []):
                table.add_row(f"▸ {action['action']}", action['impact'])
            console.print(table)
            console.print(Rule(style="magenta dim"))
            
        if roadmap.get('red_flags'):
            console.print(Panel(f"[bold red]CRITICAL BLOCKERS DETECTED:[/bold red]\n" + "\n".join([f"! {f}" for f in roadmap['red_flags']]), border_style="red"))
    except Exception as e:
        console.print(f"[bold red]Roadmap Error:[/bold red] {e}")

def run_portfolio(url: str):
    logic = get_logic()
    try:
        with Progress(
            SpinnerColumn("money"),
            TextColumn("[bold yellow]💰 Optimizing Resource Allocation Graph..."),
            transient=True,
        ) as progress:
            progress.add_task(description="Calculating...", total=None)
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
            clean_matches = [{"funding_score": m['score'], "match_score": m['score'], "funding_source": m['funding']} for m in matches]
            portfolio = logic["optimize_portfolio"](clean_matches)

        console.print(Panel(f"[bold green]TOTAL SYNERGY POTENTIAL: ${portfolio['total_potential_usd']:,}[/bold green]", title="OPTIMIZED GRANT STACK", border_style="green"))
        
        table = Table(show_header=True, header_style="bold cyan", border_style="blue")
        table.add_column("Priority", style="dim")
        table.add_column("Strategic Grant", style="bold")
        table.add_column("Match", justify="right")
        table.add_column("Effort Est.", style="yellow")

        for i, g in enumerate(portfolio['optimal_stack']):
            table.add_row(str(i+1), g['name'], f"{g['score']}%", f"{g['effort_weeks']} weeks")
        
        console.print(table)
        console.print("\n[bold yellow]EXECUTION NOTES:[/bold yellow]")
        for note in portfolio.get('strategy_notes', []):
            console.print(f" [cyan]»[/cyan] {note}")
    except Exception as e:
        console.print(f"[bold red]Portfolio Error:[/bold red] {e}")

def run_org_scan(org: str):
    logic = get_logic()
    try:
        with Progress(
            SpinnerColumn("earth"),
            TextColumn("[bold green]🏢 Scanning Organization Ecosystem..."),
            transient=True,
        ) as progress:
            progress.add_task(description="Fetching...", total=None)
            results = asyncio.run(logic["scan_org"](org))

        table = Table(title=f"TOP REPOS IN {org.upper()}", border_style="green")
        table.add_column("Repository", style="bold cyan")
        table.add_column("Stars", justify="right")
        table.add_column("Language", style="dim")
        table.add_column("Fundability", justify="center")

        for r in results.get("repos", []):
            table.add_row(
                r["repo_name"].split("/")[-1], # Show short name
                str(r["stars"]),
                r["language"] or "N/A",
                f"[bold green]{r['fundability_score']}%[/bold green]"
            )
        
        console.print(table)
        console.print(f"\n[bold yellow]ORG INSIGHT:[/bold yellow] {results.get('summary', 'Scan complete.')}")
    except Exception as e:
        console.print(f"[bold red]Org Scan Error:[/bold red] {e}")

# --- Main Entry ---

from llm_utils import load_settings, save_settings, test_connection

def system_boot():
    """Hacker-style animated boot sequence."""
    os.system('cls' if os.name == 'nt' else 'clear')
    
    stages = [
        ("CORE", "Initializing Kernel Virtualization...", 0.4),
        ("NET", "Establishing Secure SSL Handshake...", 0.6),
        ("MEM", "Allocating Neural Computation Buffers...", 0.3),
        ("AUTH", "Verifying Chiranjib Signature...", 0.5),
        ("UI", "Rendering Immersive Dashboard...", 0.2)
    ]
    
    with Progress(
        SpinnerColumn("dots12"),
        TextColumn("[bold green]{task.description}"),
        transient=True,
    ) as progress:
        for tag, desc, duration in stages:
            task = progress.add_task(description=f"[{tag}] {desc}", total=None)
            time.sleep(duration)
            progress.remove_task(task)

    glitch_splash()

def run_settings():
    """Menu to configure API providers and keys."""
    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print_header()
        settings = load_settings()
        current = settings.get("provider", "groq")
        
        console.print(f"[bold cyan]CURRENT PROVIDER:[/bold cyan] [bold green]{current.upper()}[/bold green]\n")
        
        choice = questionary.select(
            "SETTINGS CONTROL:",
            choices=[
                "🔄 Switch Provider",
                "📝 Change Model",
                "🔑 Update API Key",
                "🧪 Test Connection",
                "⬅️ Back to Main Menu"
            ],
            style=questionary.Style([
                ('pointer', 'fg:#00ffff bold'),
                ('highlighted', 'fg:#00ffff bold'),
                ('selected', 'fg:#ffffff'),
            ])
        ).ask()
        
        if choice == "🔄 Switch Provider":
            p_choice = questionary.select(
                "SELECT AI ENGINE:",
                choices=["groq", "openai", "anthropic", "gemini", "ollama"]
            ).ask()
            if p_choice:
                settings["provider"] = p_choice
                save_settings(settings)
                console.print(f"[bold green]Provider switched to {p_choice.upper()}[/bold green]")
                time.sleep(1)

        elif choice == "📝 Change Model":
            if current == "ollama":
                from llm_utils import get_ollama_models
                with console.status("[bold yellow]Fetching local models..."):
                    models = asyncio.run(get_ollama_models(settings["providers"][current]["base_url"]))
                if not models:
                    console.print("[bold red]No local models found. Is Ollama running?[/bold red]")
                    m_choice = questionary.text("Enter model name manually (e.g. llama3.2):").ask()
                else:
                    m_choice = questionary.select("Select from pulled models:", choices=models + ["Custom..."]).ask()
                    if m_choice == "Custom...":
                        m_choice = questionary.text("Enter model name:").ask()
            else:
                m_choice = questionary.text(f"Enter model name for {current.upper()} (current: {settings['providers'][current]['model']}):").ask()
            
            if m_choice:
                settings["providers"][current]["model"] = m_choice
                save_settings(settings)
                console.print(f"[bold green]Model updated to {m_choice}[/bold green]")
                time.sleep(1)
                
        elif choice == "🔑 Update API Key":
            new_key = questionary.password(f"ENTER NEW KEY FOR {current.upper()}:").ask()
            if new_key:
                settings["providers"][current]["api_key"] = new_key
                save_settings(settings)
                console.print("[bold green]API Key updated successfully.[/bold green]")
                time.sleep(1)
                
        elif choice == "🧪 Test Connection":
            config = settings["providers"][current]
            with console.status(f"[bold yellow]Pinging {current.upper()} API..."):
                success, msg = asyncio.run(test_connection(current, config))
            if success:
                console.print(f"[bold green]✓ {msg}[/bold green]")
            else:
                console.print(f"[bold red]✗ Connection Failed: {msg}[/bold red]")
            input("\nPress Enter to continue...")
            
        elif choice == "⬅️ Back to Main Menu":
            break

# --- Main Entry ---

@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    if ctx.invoked_subcommand is not None:
        return

    system_boot()
    
    # Proactive configuration check
    settings = load_settings()
    current = settings.get("provider", "groq")
    if not settings["providers"].get(current, {}).get("api_key") and current != "ollama":
        console.print(Panel(
            "[bold yellow]SYSTEM ALERT:[/bold yellow] No API key detected for the active provider ([bold]{current.upper()}[/bold]).\n"
            "AI features will fail. Please head to [bold]API CONFIGURATION[/bold] to set it up.",
            border_style="yellow",
            title="Configuration Required"
        ))
        time.sleep(1)

    while True:
        choice = questionary.select(
            "CHIRANJIB COMMAND CENTER // SELECT ACTION:",
            choices=[
                "📡 FULL SYSTEM SCAN (Grants + Metrics)",
                "📅 GENERATE 90-DAY ROADMAP (Calendar)",
                "💼 OPTIMIZE GRANT PORTFOLIO",
                "🎯 SEARCH LIVE BOUNTIES",
                "📝 DRAFT PRO APPLICATION",
                "💰 GENERATE MONETIZATION STRATEGY",
                "🌐 DEPLOY WEB INTERFACE",
                "⚙️  API CONFIGURATION",
                "❌ SHUTDOWN"
            ],
            style=questionary.Style([
                ('pointer', 'fg:#00ff00 bold'),
                ('highlighted', 'fg:#00ffff bold'),
                ('selected', 'fg:#ff00ff'),
                ('question', 'fg:#ffffff bold'),
                ('answer', 'fg:#ffffff bold')
            ])
        ).ask()

        if choice == "📡 FULL SYSTEM SCAN (Grants + Metrics)":
            url = questionary.text("REPOSITORY URL:").ask()
            if url:
                # Upgraded Full Scan runner inside menu
                logic = get_logic()
                try:
                    with Progress(
                        SpinnerColumn("dots12"),
                        TextColumn("[bold cyan]{task.description}"),
                        transient=True,
                    ) as progress:
                        progress.add_task(description="[HACKER] Intercepting Repository Data...", total=None)
                        repo_data = asyncio.run(logic["fetch_repo_data"](url))
                        progress.add_task(description="[HACKER] Calculating Synergy Matrices...", total=None)
                        matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
                        progress.add_task(description="[HACKER] Compiling Fundability Score...", total=None)
                        score_data = logic["analyze_fundability"](repo_data)

                    # Multi-Panel Pro Dashboard
                    layout = Layout()
                    layout.split_column(
                        Layout(name="head", size=3),
                        Layout(name="main", ratio=1)
                    )
                    layout["main"].split_row(
                        Layout(name="left", ratio=1),
                        Layout(name="right", ratio=2)
                    )
                    
                    m_table = Table(show_header=False, box=None)
                    m_table.add_row("[cyan]Power Score[/cyan]", f"[bold yellow]{score_data['total_score']}/100[/bold yellow]")
                    m_table.add_row("[cyan]Health Grade[/cyan]", f"[bold green]{score_data['grade']}[/bold green]")
                    m_table.add_row("[cyan]Contributors[/cyan]", str(repo_data.get('contributors_count', 0)))
                    m_table.add_row("[cyan]Weekly Commits[/cyan]", f"{repo_data.get('commit_frequency', 0):.1f}")
                    
                    layout["head"].update(Panel(f"[bold white]REPOSITORY DIAGNOSTIC: {repo_data['repo_name'].upper()}[/bold white]", border_style="blue"))
                    layout["left"].update(Panel(m_table, title="[yellow]Core Metrics[/yellow]", border_style="yellow"))
                    
                    matches_table = Table(title="[bold green]BEST FUNDING MATCHES[/bold green]", border_style="green", expand=True)
                    matches_table.add_column("Funder", style="bold")
                    matches_table.add_column("Level", justify="right")
                    matches_table.add_column("Amount", style="yellow")
                    for m in matches[:6]:
                        fs = m.get('funding', {})
                        matches_table.add_row(fs.get('name', 'N/A'), f"{m['score']}%", f"${fs.get('max_amount', 0):,}")
                    
                    layout["right"].update(Panel(matches_table, border_style="green"))
                    console.print(layout)
                except Exception as e:
                    console.print(f"[bold red]Scan Failed:[/bold red] {e}")

        elif choice == "📅 GENERATE 90-DAY ROADMAP (Calendar)":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_roadmap(url)
        elif choice == "💼 OPTIMIZE GRANT PORTFOLIO":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_portfolio(url)
        elif choice == "🧬 FUNDED DNA COMPARISON":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_dna_scan(url)
        elif choice == "🏢 ORGANIZATION SCAN":
            org = questionary.text("GITHUB ORGANIZATION NAME:").ask()
            if org: run_org_scan(org)
        elif choice == "📦 DEPENDENCY SCANNER":
            run_dependency_scan()
        elif choice == "🎯 SEARCH LIVE BOUNTIES":
            query = questionary.text("QUERY:", default="label:bounty").ask()
            if query:
                from backend.monetization import fetch_live_bounties
                with console.status("[bold magenta]Scouring GitHub for Bounties..."):
                    bounties = asyncio.run(fetch_live_bounties(query))
                table = Table(title="LIVE BOUNTIES", border_style="magenta", expand=True)
                table.add_column("Title", style="white")
                table.add_column("Amount", style="green")
                table.add_column("Link", style="dim")
                for b in bounties[:10]:
                    table.add_row(b['title'][:40], f"${b['amount']}", b['html_url'])
                console.print(table)
        elif choice == "📝 DRAFT PRO APPLICATION":
            url = questionary.text("REPOSITORY URL:").ask()
            if url:
                f_id = questionary.text("ENTER FUNDING ID FROM SCAN:").ask()
                if f_id:
                    from backend.application_writer import generate_application
                    from backend.funding_db import FUNDING_SOURCES
                    from backend.github_api import fetch_repo_data
                    with console.status("[bold green]Drafting Advanced Application AI Response..."):
                        repo_data = asyncio.run(fetch_repo_data(url))
                        fs = FUNDING_SOURCES[int(f_id)-1] if f_id.isdigit() else FUNDING_SOURCES[0]
                        app_json = asyncio.run(generate_application(repo_data, fs))
                    
                    from rich.markdown import Markdown
                    md_text = f"# GRANT APPLICATION DRAFT\n\n**Funder:** {fs['name']}\n**Project:** {repo_data['repo_name']}\n\n"
                    md_text += f"## Executive Summary\n{app_json.get('summary', 'N/A')}\n\n"
                    md_text += f"## Technical Merit\n{app_json.get('technical_merit', 'N/A')}\n\n"
                    md_text += f"## Impact\n{app_json.get('impact_statement', 'N/A')}\n"
                    console.print(Panel(Markdown(md_text), border_style="green", title="AI PRO DRAFT"))
                    
        elif choice == "💰 GENERATE MONETIZATION STRATEGY":
            url = questionary.text("REPOSITORY URL:").ask()
            if url:
                from backend.monetization import generate_monetization_strategy
                from backend.github_api import fetch_repo_data
                with console.status("[bold blue]Calculating Monetization Vector..."):
                    repo_data = asyncio.run(fetch_repo_data(url))
                    strategy = asyncio.run(generate_monetization_strategy(repo_data))
                
                table = Table(title="MONETIZATION STRATEGY", border_style="blue", expand=True)
                table.add_column("Channel", style="bold cyan")
                table.add_column("Tactics")
                for item in strategy.get('channels', []):
                    table.add_row(item['name'], ", ".join(item['tactics']))
                console.print(table)
                console.print(Panel(str(strategy.get('fundingYml', '')), title="funding.yml suggested content", border_style="dim"))

        elif choice == "🌐 DEPLOY WEB INTERFACE":
            console.print("[bold green]DEPLOYING SERVERS...[/bold green]")
            import subprocess
            if os.name == 'nt': subprocess.Popen(["cmd", "/c", "START.bat"])
            else: subprocess.Popen(["sh", "./START.bat"])
            break
        elif choice == "⚙️  API CONFIGURATION":
            run_settings()
        elif choice == "❌ SHUTDOWN":
            console.print("[bold cyan]COMMAND CENTER OFFLINE. GOODBYE CHIRANJIB.[/bold cyan]")
            break
        
        input("\n[bold green]>>> SYSTEM READY. PRESS ENTER TO RETURN TO MENU...[/bold green]")
        os.system('cls' if os.name == 'nt' else 'clear')

if __name__ == "__main__":
    app()
