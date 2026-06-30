from pathlib import Path
from codegraph_cli.parser import TreeSitterParser

project_root = Path(".")
parser = TreeSitterParser(project_root, languages=["javascript"])

file_to_test = Path("test-api.js")
if file_to_test.exists():
    print(f"Testing file: {file_to_test}")
    nodes, edges = parser.parse_file(file_to_test)
    print(f"Nodes: {len(nodes)}")
    print(f"Edges: {len(edges)}")
    for node in nodes:
        print(f"Node: {node.node_id}, type: {node.node_type}, name: {node.name}")
else:
    print(f"File {file_to_test} not found.")
