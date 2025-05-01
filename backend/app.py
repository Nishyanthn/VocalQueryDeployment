from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv
import google.generativeai as genai
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from sqlalchemy import create_engine
import os
from typing import Dict, Any
import re

from typing_extensions import TypedDict
from typing import Annotated, Optional
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.utilities import SQLDatabase
from sqlalchemy import create_engine
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.prebuilt import ToolNode, tools_condition

from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver




app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables
load_dotenv()

# Set up Google Generative AI API Key
api_key = os.getenv("GEMINI_API_KEY")  # Use environment variable for security
genai.configure(api_key=api_key)

openai_api_key = os.getenv("")

# Your PostgreSQL connection details
DB_HOST = "localhost"
DB_PORT = "5432"
DB_USER = "postgres"  # Replace with your PostgreSQL username
DB_PASSWORD = "Postgres@4902"  # Replace with your PostgreSQL password


class GeminiAI:
    def __init__(self, api_key, model_name):
        self.api_key = api_key
        self.model_name = model_name
        genai.configure(api_key=self.api_key)

    def generate_response(self, prompt):
        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error occurred: {e}"
        

@app.route('/convert_to_sql', methods=['POST'])
def convert_to_sql():
    try:
        data = request.get_json()
        user_input = data.get('user_input')

        if not user_input:
            return jsonify({"error": "User input is required!"}), 400

        # Initialize the model for Google Generative AI
        model_name = "gemini-1.5-flash-latest"  # Adjust this to the correct model name
        gemini_client = GeminiAI(api_key, model_name)
        prompt = f"""
        You are an expert in converting English questions to PostgreSQL SQL queries. 
        - The SQL code should not have triple backticks (```) or the word "sql" in the output.
        - Always end the query with a semicolon.
        - Do not explain the SQL query; only return the query itself.
        - Use correct PostgreSQL syntax and conventions.

        Examples:
        1. Input: "Create a table with columns for student name, age, and grade."
           Output: CREATE TABLE students (name VARCHAR(50), age INT, grade FLOAT);

        2. Input: "Find all employees earning more than $5000."
           Output: SELECT * FROM employees WHERE salary > 5000;

        Now, generate a PostgreSQL query for the following user input:
        {user_input}
        """


        sql_query = gemini_client.generate_response(prompt)

        if not sql_query:
            return jsonify({"error": "No SQL query returned by Gemini model!"}), 500
        


        return jsonify({"sql_query": sql_query})    
        



    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500
    



@app.route('/create_database', methods=['POST'])
def create_database():
    try:
        data = request.get_json()
        new_db_name = data.get('database_name')

        if not new_db_name:
            return jsonify({"error": "Database name is required!"}), 400

        # Connect to PostgreSQL server (without specifying a database)
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        connection.autocommit = True
        cursor = connection.cursor()

        # Create a new database
        cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(new_db_name)))

        cursor.close()
        connection.close()

        return jsonify({"message": f"Database '{new_db_name}' created successfully!"})

    except Exception as e:
        print(f"Error creating database: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/get_databases', methods=['GET'])
def get_databases():
    try:
        # Connect to the PostgreSQL server
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        connection.autocommit = True

        # Fetch available databases
        with connection.cursor() as cursor:
            cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
            databases = cursor.fetchall()

        # Extract database names
        db_list = [db[0] for db in databases]
        return jsonify({"databases": db_list})

    except Exception as e:
        print(f"Error fetching databases: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            connection.close()


@app.route('/get_tables', methods=['POST'])
def get_tables():
    try:
        data = request.get_json()
        database_name = data.get('database_name')

        # Connect to the database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=database_name
        )
        cur = conn.cursor()

        # Fetch the list of tables
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [row[0] for row in cur.fetchall()]

        cur.close()
        conn.close()

        return jsonify({"success": True, "tables": tables})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})



@app.route('/execute_sql', methods=['POST'])
def execute_sql():

    try:
        data = request.get_json()
        db_name = data.get('database_name')
        sql_query = data.get('sql_query')
        table_name = data.get('table_name')
        print(db_name)
        print(sql_query)
        print(table_name)
        print("1")

        if not db_name:
            return jsonify({"error": "Database name is required!"}), 400
        if not sql_query:
            return jsonify({"error": "SQL query is required!"}), 400
        
        print("2")

        # Connect to the selected PostgreSQL database
        connection = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=db_name
        )
        print("2.5")

        cursor = connection.cursor()
        print("3")

          # If a table is provided, append it to the SQL query if needed (for example, for INSERT queries)
        # if table_name:
        #     sql_query = sql_query.replace("{table_name}", table_name)

        # Execute the query
        cursor.execute(sql_query)
        print("4")

        # Commit if necessary and close the connection
        connection.commit()
        print("5")
        cursor.close()
        connection.close()
        print("6")

        return jsonify({"message": "Query executed successfully!"})
    

    except Exception as e:
        print("7")
        return jsonify({"error": str(e)}), 500






# Replace these with your actual PostgreSQL credentials
db_name = "Nish"
db_user = "postgres"
db_password = "Postgres%404902"
db_host = "localhost"
db_port = "5432"

# Create the PostgreSQL connection string
connection_string = f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Create the SQLAlchemy engine
engine = create_engine(connection_string)

# Initialize the SQLDatabase object
db = SQLDatabase(engine=engine)

# api_key = os.getenv("GEMINI_API_KEY")  # Use environment variable for security
# genai.configure(api_key=api_key)

genai.configure(api_key="AIzaSyCF6vHl1Sp1I0JUmiR8y7FBCkRh55LJzHo")

toolkit = SQLDatabaseToolkit(db=db, llm=ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0))
sql_db_toolkit_tools = toolkit.get_tools()

query_gen_system = """
I am an SQL expert who helps analyze database queries. I have access to tools for interacting with the database. When given a question, I'll think through it carefully and explain my reasoning in natural language.
 
Then I'll walk through my analysis process:

1. First, I'll understand what tables and data I need
2. Then, I'll verify the schema and relationships
3. Finally, I'll construct an appropriate SQL query

For each query, I'll think about:
- What tables are involved and how they connect
- Any special conditions or filters needed
- How to handle potential edge cases
- The most efficient way to get the results

<reasoning>
I will *always* include this section before writing a query. Here, I will:
- Explain what information I need and why  
- Describe my expected outcome  
- Identify potential challenges  
- Justify my query structure  

If this section is missing, I will rewrite my response to include it.
</reasoning>

<analysis>
Here I break down the key components needed for the query:
- Required tables and joins
- Important columns and calculations
- Any specific filters or conditions
- Proper ordering and grouping
</analysis>

<query>
The final SQL query
</query>

<error_check>
If there's an error, I'll explain:
- What went wrong
- Why it happened
- How to fix it
</error_check>

<final_check>
Before finalizing, I will verify:
- Did I include a clear reasoning section?
- Did I explain my approach before querying?
- Did I provide an analysis of the query structure?
- If any of these are missing, I will revise my response.
</final_check>

Important rules:
1. Only use SELECT statements, no modifications
2. Verify all schema assumptions
3. Use proper SQLite syntax
4. Limit results to 10 unless specified
5. Double-check all joins and conditions
6. Always include tool_analysis and tool_reasoning for each tool call
"""

query_gen_prompt = ChatPromptTemplate.from_messages([
    ("system", query_gen_system),
    MessagesPlaceholder(variable_name="messages"),
])

query_gen_model = query_gen_prompt | ChatGoogleGenerativeAI(
    model="gemini-1.5-flash-latest", temperature=0).bind_tools(tools=sql_db_toolkit_tools)

class State(TypedDict):
    messages: Annotated[list, add_messages]


graph_builder = StateGraph(State)


def query_gen_node(state: State):
    return {"messages": [query_gen_model.invoke(state["messages"])]}


checkpointer = MemorySaver()

graph_builder.add_node("query_gen", query_gen_node)
query_gen_tools_node = ToolNode(tools=sql_db_toolkit_tools)
graph_builder.add_node("query_gen_tools", query_gen_tools_node)

graph_builder.add_conditional_edges(
    "query_gen",
    tools_condition,
    {"tools": "query_gen_tools", END: END},
)

graph_builder.add_edge("query_gen_tools", "query_gen")
graph_builder.set_entry_point("query_gen")
graph = graph_builder.compile(checkpointer=checkpointer)


def format_section(title: str, content: str) -> str:
    if not content:
        return ""
    return f"\n{content}\n"


def extract_section(text: str, section: str) -> str:
    pattern = f"<{section}>(.*?)</{section}>"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""


def process_event(event: Dict[str, Any]) -> Optional[str]:
    if 'query_gen' in event:
        messages = event['query_gen']['messages']
        for message in messages:
            content = message.content if hasattr(message, 'content') else ""

            reasoning = extract_section(content, "reasoning")
            if reasoning:
                print(format_section("", reasoning))

            analysis = extract_section(content, "analysis")
            if analysis:
                print(format_section("", analysis))

            error_check = extract_section(content, "error_check")
            if error_check:
                print(format_section("", error_check))

            final_check = extract_section(content, "final_check")
            if final_check:
                print(format_section("", final_check))

            if hasattr(message, 'tool_calls'):
                for tool_call in message.tool_calls:
                    tool_name = tool_call['name']
                    if tool_name == 'sql_db_query':
                        return tool_call['args']['query']

            query = extract_section(content, "query")
            if query:
                sql_match = re.search(r'sql\n(.*?)\n', query, re.DOTALL)
                if sql_match:
                    return sql_match.group(1).strip()

    return None


def run_query(query_text: str):
    print(f"\nAnalyzing your question: {query_text}")
    final_sql = None

    for event in graph.stream({"messages": [("user", query_text)]},
                              config={"configurable": {"thread_id": 12}}):
        sql = process_event(event)
        if sql:
            final_sql = sql

    if final_sql:
        print(
            "\nBased on my analysis, here's the SQL query that will answer your question:")
        print(f"\n{final_sql}")

        # Execute the query and display the results
        try:
            print("\nQuery Results:")
            results = db.run(final_sql)
            print(results)
        except Exception as e:
            print(f"\nAn error occurred while executing the query: {str(e)}")

        return final_sql
    
@app.route('/query', methods=['POST'])

def handle_query():
    try:
        data = request.get_json()
        query = data.get('question')

        if not query:
            return jsonify({"error": "Query is required"}), 400

        if query.lower() in ['exit', 'quit']:
            return jsonify({"message": "Thank you for using SQL Assistant!"})

        print(f"Received query: {query}")

        # Get the SQL query
        sql_query = run_query(query)
        
        if sql_query is None:
            return jsonify({"error": "No query result generated"}), 500

        # Execute the query and get results
        try:
            raw_results = db.run(sql_query)
            # Process the results to extract just the food items
            if raw_results:
                # Parse the string results if needed (they might come as string representation)
                if isinstance(raw_results, str):
                    # Handle string representation of results
                    import ast
                    try:
                        raw_results = ast.literal_eval(raw_results)
                    except:
                        pass
                
                # Extract food items from the results
                food_items = []
                if isinstance(raw_results, list):
                    for item in raw_results:
                        if isinstance(item, tuple):
                            food_items.append(item[0])  # Assuming food is first column
                        elif isinstance(item, dict):
                            food_items.append(item.get('food', ''))
                        else:
                            food_items.append(str(item))
                
                # Remove duplicates if needed
                unique_food_items = list(set(food_items))
                
                return jsonify({"answer": unique_food_items})
            else:
                return jsonify({"error": "No results found"}), 404
                
        except Exception as e:
            print(f"\nAn error occurred while executing the query: {str(e)}")
            return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

