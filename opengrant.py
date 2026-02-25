import os
import sys
import json
import asyncio
from typing import Optional
from datetime import datetime

# Add backend to path so we can import modules
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    import typer
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import print as rprint
except ImportError:
    print("Error: 'typer' and 'rich' are required for the CLI. Run: pip install typer rich")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))

# Lazy imports for backend logic
def get_logic():
    from backend.matcher import run_matching
    from backend.github_api import fetch_repo_data
    from backend.monetization import fetch_live_bounties, generate_monetization_strategy
    from backend.fundability import analyze_fundability
    return fetch_repo_data, run_matching, fetch_live_bounties, generate_monetization_strategy, analyze_fundability

app = typer.Typer(help="OpenGrant CLI - Find funding and monetize your OSS projects.")
console = Console()

ASCII_ART = """
[bold cyan]  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███╗   ██╗████████╗[/bold cyan]
[bold cyan] ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝[/bold cyan]
[bold blue] ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██████╔╝███████║██╔██╗ ██║   ██║   [/bold blue]
[bold blue] ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║   ██║   [/bold blue]
[bold magenta] ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║ ╚████║   ██║   [/bold magenta]
[bold magenta]  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   [/bold magenta]
"""

def print_header():
    from rich.columns import Columns
    from rich.console import Group
    from rich.text import Text

    # Header section
    console.print(ASCII_ART, justify="center")
    
    header_info = Text.assemble(
        (" The AI-Powered Open Source Funding Discovery Platform ", "bold white on blue"),
        ("\nCreated by ChiranjibAI | Empowering developers worldwide.", "italic dim")
    )
    console.print(header_info, justify="center")
    console.print("\n")

@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """
    Main entry point for OpenGrant CLI. Starts interactive menu if no command is given.
    """
    if ctx.invoked_subcommand is not None:
        return

    try:
        import questionary
    except ImportError:
        console.print("[yellow]Notice: 'questionary' is required for the interactive menu. Run: pip install questionary[/yellow]")
        print_header()
        # Fallback to help
        console.print("[bold yellow]Available Commands:[/bold yellow]")
        console.print("  [bold green]scan[/bold green] [dim]<url>[/dim]      - Scan repo for funding matches")
        console.print("  [bold green]monetize[/bold green] [dim]<url>[/dim]  - Generate AI monetization strategy")
        console.print("  [bold green]bounties[/bold green]         - Search live paid bounties")
        console.print("  [bold green]write[/bold green] [dim]<url> <id>[/dim] - Draft a full grant application")
        console.print("  [bold green]serve[/bold green]            - Start full-stack UI & API")
        return

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print_header()
        
        choice = questionary.select(
            "What would you like to do?",
            choices=[
                "🔍 Scan Repository (Grants Matching)",
                "💰 Generate Monetization Strategy",
                "🎯 Search Live Bounties",
                "📝 Draft Grant Application",
                "🌐 Launch Web Dashboard",
                "❌ Exit"
            ],
            style=questionary.Style([
                ('qmark', 'fg:#673ab7 bold'),
                ('question', 'bold'),
                ('answer', 'fg:#f44336 bold'),
                ('pointer', 'fg:#673ab7 bold'),
                ('highlighted', 'fg:#673ab7 bold'),
                ('selected', 'fg:#cc2787'),
                ('separator', 'fg:#cc5454'),
                ('instruction', ''),
                ('text', ''),
                ('disabled', 'fg:#858585 italic')
            ])
        ).ask()

        if choice == "🔍 Scan Repository (Grants Matching)":
            url = questionary.text("Enter GitHub Repository URL:").ask()
            if url: scan(url)
        elif choice == "💰 Generate Monetization Strategy":
            url = questionary.text("Enter GitHub Repository URL:").ask()
            if url: monetize(url)
        elif choice == "🎯 Search Live Bounties":
            query = questionary.text("Search Query (default: label:bounty):", default="label:bounty label:\"help wanted\" state:open").ask()
            if query: bounties(query)
        elif choice == "📝 Draft Grant Application":
            url = questionary.text("Enter GitHub Repository URL:").ask()
            if url:
                f_id = questionary.text("Enter Funding ID (from scan results):").ask()
                if f_id: write(url, int(f_id))
        elif choice == "🌐 Launch Web Dashboard":
            serve()
            break
        elif choice == "❌ Exit":
            console.print("[bold cyan]Goodbye! See you on GitHub @chiranjibai[/bold cyan]")
            break
        
        input("\nPress Enter to return to menu...")

@app.command()
def scan(url: str):
    """Scan a repository and find funding matches."""
    print_header()
    fetch_repo_data, run_matching, _, _, analyze_fundability = get_logic()
    
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="Fetching repository data...", total=None)
            repo_data = asyncio.run(fetch_repo_data(url))
            
            if "error" in repo_data:
                console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
                raise typer.Exit(1)

            progress.add_task(description="Analyzing funding matches...", total=None)
            from backend.funding_db import FUNDING_SOURCES
            for i, fs in enumerate(FUNDING_SOURCES):
                if "id" not in fs:
                    fs["id"] = i + 1
                    
            matches = asyncio.run(run_matching(repo_data, FUNDING_SOURCES))
            
            progress.add_task(description="Calculating fundability score...", total=None)
            score_data = analyze_fundability(repo_data)

        # UI Output
        console.print(Panel(f"[bold green]Analysis Complete for {repo_data['repo_name']}[/bold green]"))
        
        score_table = Table(title="Fundability Dashboard")
        score_table.add_column("Metric", style="cyan")
        score_table.add_column("Value", style="magenta")
        score_table.add_row("Overall Grade", f"[bold]{score_data['grade']}[/bold] ({score_data['total_score']}/100)")
        score_table.add_row("Stars", str(repo_data.get('stars', 0)))
        score_table.add_row("Issues Found", str(len(matches)))
        console.print(score_table)

        match_table = Table(title="Top Funding Matches")
        match_table.add_column("Source", style="green")
        match_table.add_column("Match %", justify="right")
        match_table.add_column("Amount", style="yellow")
        match_table.add_column("Deadline", style="dim")

        for match in matches[:10]:
            fs = match.get('funding', {})
            match_table.add_row(
                fs.get('name', 'Unknown'),
                f"{match.get('score', 0)}%",
                fs.get('amount_display') or (f"${fs['max_amount']:,}" if fs.get('max_amount') else "Variable"),
                fs.get('deadline', 'Rolling')
            )
        console.print(match_table)
        rprint(f"\n[dim]Run [bold]python opengrant.py serve[/bold] to see the full list.[/dim]")

    except Exception as e:
        if "rate_limit" in str(e).lower():
            console.print(Panel("[bold red]AI Rate Limit Exceeded[/bold red]\nYour AI provider (Groq/OpenAI) has reached its daily limit.\nPlease try again in a few minutes or upgrade your API tier.", border_style="red", title="API Error"))
        else:
            console.print(f"[bold red]Unexpected Error:[/bold red] {e}")

@app.command()
def bounties(query: str = "label:bounty label:\"help wanted\" state:open"):
    """Fetch live paid bounties from GitHub."""
    print_header()
    _, _, fetch_live_bounties, _, _ = get_logic()
    
    with console.status("[bold green]Searching for bounties...") as status:
        bounties_list = asyncio.run(fetch_live_bounties(query))

    table = Table(title=f"Live Bounties for: {query}")
    table.add_column("Title", style="cyan", no_wrap=False)
    table.add_column("Repo", style="magenta")
    table.add_column("Amount", style="green")
    table.add_column("Platform", style="dim")

    for b in bounties_list[:15]:
        table.add_row(
            b['title'][:50] + "..." if len(b['title']) > 50 else b['title'],
            b['repo'],
            f"${b['amount']}",
            b['platform']
        )
    console.print(table)

@app.command()
def monetize(url: str):
    """Generate an AI monetization strategy for a repository."""
    print_header()
    fetch_repo_data, _, _, generate_monetization_strategy, _ = get_logic()
    
    try:
        with console.status("[bold yellow]Generating AI Strategy...") as status:
            repo_data = asyncio.run(fetch_repo_data(url))
            if "error" in repo_data:
                console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
                return
            
            strategy = asyncio.run(generate_monetization_strategy(repo_data))

        console.print(Panel.fit("[bold green]AI Monetization Strategy[/bold green]"))
        
        if not strategy or not isinstance(strategy, dict):
            console.print("[yellow]Warning: AI strategy was empty or invalid. Using defaults.[/yellow]")
            strategy = {}

        console.print("\n[bold]FUNDING.yml Suggestion:[/bold]")
        console.print(Panel(str(strategy.get('fundingYml') or 'N/A'), border_style="blue"))
        
        console.print("\n[bold]README Support Snippet:[/bold]")
        console.print(Panel(str(strategy.get('readmeSnippet') or 'N/A'), border_style="magenta"))
        
        console.print("\n[bold]Expert Tips:[/bold]")
        tips = strategy.get('tips') or ["Enable GitHub Sponsors", "Add a FUNDING.yml file", "Look for grants"]
        for tip in tips:
            if tip:
                console.print(f" • {tip}")
    except Exception as e:
        if "rate_limit" in str(e).lower():
            console.print(Panel("[bold red]AI Rate Limit Exceeded[/bold red]\nShowing default monetization strategy instead...", border_style="yellow"))
            # Fallback
            console.print(f"\n • Enable GitHub Sponsors\n • Add a FUNDING.yml file\n • Link your Patreon")
        else:
            console.print(f"[bold red]Unexpected Error:[/bold red] {e}")

@app.command()
def write(url: str, funding_id: int):
    """Generate a complete grant application for a repository and funding source."""
    print_header()
    fetch_repo_data, _, _, _, _ = get_logic()
    from backend.application_writer import generate_application
    from backend.funding_db import FUNDING_SOURCES
    
    try:
        with console.status("[bold blue]Drafting Grant Application...") as status:
            repo_data = asyncio.run(fetch_repo_data(url))
            if "error" in repo_data:
                console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
                return
                
            if funding_id < 1 or funding_id > len(FUNDING_SOURCES):
                console.print(f"[bold red]Error:[/bold red] Funding ID {funding_id} not found.")
                return
                
            funding_source = FUNDING_SOURCES[funding_id - 1]
            funding_source["id"] = funding_id
            application = asyncio.run(generate_application(repo_data, funding_source))

        if "error" in application:
            console.print(f"[bold red]Error:[/bold red] {application['error']}")
            return

        console.print(Panel(f"[bold green]Application Draft Ready for {funding_source['name']}[/bold green]"))
        filename = f"application_{repo_data['repo_name'].replace('/', '_')}_{funding_id}.json"
        with open(filename, "w") as f:
            json.dump(application, f, indent=2)
            
        console.print(f"\n[cyan]Executive Summary:[/cyan]\n{application.get('executive_summary', 'N/A')}")
        console.print(f"\n[bold green]Full JSON saved to: {filename}[/bold green]")
    except Exception as e:
        if "rate_limit" in str(e).lower():
            console.print(Panel("[bold red]AI Rate Limit Exceeded[/bold red]\nAI writer is currently busy. Please try again later.", border_style="red"))
        else:
            console.print(f"[bold red]Unexpected Error:[/bold red] {e}")

@app.command()
def serve():
    """Start both backend and frontend servers."""
    console.print("[bold green]Starting OpenGrant Full Stack...[/bold green]")
    import subprocess
    
    if os.name == 'nt': # Windows
        subprocess.Popen(["cmd", "/c", "START.bat"])
    else: # Mac/Linux
        subprocess.Popen(["sh", "./START.bat"])
    
    console.print("[bold]Servers launched in separate windows.[/bold]")
    console.print("API: [blue]http://localhost:8765/docs[/blue]")
    console.print("UI:  [blue]http://localhost:5173[/blue]")

if __name__ == "__main__":
    app()
