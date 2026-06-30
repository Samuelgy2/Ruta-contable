from tree_sitter import Language, Parser
import tree_sitter_javascript

# This is a test to see if tree-sitter can be used
try:
    JS_LANGUAGE = Language(tree_sitter_javascript.language())
    parser = Parser(JS_LANGUAGE)
    
    source_code = b"function hello() { console.log('hello world'); }"
    tree = parser.parse(source_code)
    
    print(f"Root node type: {tree.root_node.type}")
    print(f"Root node children count: {tree.root_node.child_count}")
    
    for child in tree.root_node.children:
        print(f"Child type: {child.type}, text: {child.text.decode('utf-8')}")
        
except Exception as e:
    print(f"Error: {e}")
