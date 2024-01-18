import React, { useState, useEffect } from "react";

import EditorBox from "./components/EditorBox";
import Graph from "./components/Graph";
import Layout from "./components/Layout";

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.inputRef = React.createRef();

        this.state = {
            input: "",
            hyperedge: [],
            hypergraph: [],
            layout: {
                name: "cose-bilkent",
                padding: 75
            }
        };
    }

    componentDidMount() {
        console.log("STATE", this.state);
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        document.addEventListener("keypress", this.handleKeyPress.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown.bind(this));
        document.removeEventListener("keypress", this.handleKeyPress.bind(this));
    }

    handleKeyPress(event) {
        this.inputRef.current.focus();
        if (event.key === "Enter") {
            const input = this.state.input;
            this.setState({ input: "", hyperedge: [...this.state.hyperedge, input] });
        }
    }

    handleKeyDown(event) {
        if (event.key === "Backspace" || event.key === "Escape") {
            if (!event.repeat && this.state.input === "") {
                this.setState({ hyperedge: this.state.hyperedge.slice(0, -1) });
            }
        }
    }

    render() {
        return (
            <div className="h-screen w-full flex flex-col relative p-4">
                <div className="text-xl text-center h-12 flex gap-4 justify-center items-center p-4">
                    {this.state.hyperedge.map((item, i) => {
                        return (
                            <div className="bg-gray-100 rounded-lg p-2" key={`${item}-${i}`}>
                                {item}
                            </div>
                        );
                    })}
                </div>
                <br />
                <div className="text-5xl text-center">
                    <input
                        type="text"
                        autoFocus
                        className="opacity-0 focus:opacity-100 outline-none p-4 text-center bg-transparent"
                        ref={this.inputRef}
                        value={this.state.input}
                        onChange={(e) => this.setState({ input: e.target.value })}
                    />
                </div>
            </div>
        );
    }
}

/*
export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            hyperedge: [],
            hypergraph: [],
            layout: {
                name: "cose-bilkent",
                padding: 75
            }
        };
    }

    componentDidMount() {
        window.ht_cy.on("select", "node", (e) => {
            this.onSelectNode(e.target.id());
        });

        window.ht_cy.on("cxttap", "node", (e) => {
            this.onRemoveNode(e.target.id());
        });

        window.api.hypergraph.all().then((hyperedges) => {
            const hypergraph = this.hyperedgesToGraph(hyperedges);
            this.setState({ hypergraph }, async () => {
                this.layout();
            });
        });

        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    }

    // TODO: Move this from EditorBox to App...needs input moved here
    handleKeyDown(event) {
        // if (event.key === "Backspace" || event.key === "Escape") {
        //     if (input === "") {
        //         setHyperedge(hyperedge.slice(0, -1));
        //     }
        // }
    }

    get data() {
        if (this.state.hyperedge.length > 0) {
            return Object.values(this.search());
        } else {
            return Object.values(this.state.hypergraph);
        }
    }

    search() {
        const hypergraph = {};

        const keys = [];
        const edge = [];
        for (const node of this.state.hyperedge) {
            edge.push(node);
            const id = edge.join("-");
            keys.push(id);

            if (edge.length > 1) {
                keys.push(`${id}-edge`);
            }
        }

        for (const key of Object.keys(this.state.hypergraph)) {
            for (const k of keys) {
                // hacky
                if (key.indexOf(k) !== -1) {
                    hypergraph[key] = this.state.hypergraph[key];
                    if (key.indexOf("edge") !== -1) {
                        const parent = hypergraph[key].data.source;
                        hypergraph[parent] = this.state.hypergraph[parent];
                    }
                }
            }
        }

        return hypergraph;
    }

    handleHyperedgeChange(hyperedge) {
        this.setState({ hyperedge }, this.layout.bind(this));
    }

    setLayout(layout) {
        this.setState({ layout }, this.layout.bind(this));
    }

    onSelectNode(node) {
        const symbol = this.state.hypergraph[node].data.label;
        console.log(symbol);
        this.setState({ hyperedge: [...this.state.hyperedge, symbol] }, this.layout.bind(this));
        console.log("SELECTED NODE AT SYMBOL", symbol);
    }

    onRemoveNode(node) {
        const data = this.state.hypergraph[node].data;
        console.log("REMOVE", data);

        const hypergraph = { ...this.state.hypergraph };
        delete hypergraph[data.id];

        this.setState({ hypergraph }, async () => {
            this.layout();
        });
    }

    layout() {
        window.ht_cy.layout(this.state.layout).run();
    }

    hyperedgesToGraph(hyperedges) {
        let hypergraph = {};
        for (const hyperedge of hyperedges) {
            hypergraph = {
                ...hypergraph,
                ...this.hyperedgeToGraph(hyperedge)
            };
        }
        return hypergraph;
    }

    hyperedgeToGraph(hyperedge) {
        const hypergraph = {};
        const edge = [];
        for (const node of hyperedge) {
            const prev_id = edge.join("-");

            edge.push(node);
            let id = edge.join("-");

            hypergraph[id] = { data: { id, label: node } };
            if (edge.length > 1) {
                const edge_id = `${id}-edge`;
                hypergraph[edge_id] = { data: { id: edge_id, source: prev_id, target: id } };
            }
        }

        return hypergraph;
    }

    async onBuildHyperEdge(hyperedge) {
        const hypergraph = {
            ...this.state.hypergraph,
            ...this.hyperedgeToGraph(hyperedge)
        };

        this.setState({ hypergraph }, async () => {
            this.layout();
            await window.api.hypergraph.add(hyperedge);
        });
    }

    // TODO: Click on a node...add it to the hyperedge...update the context
    // TODO: Hit escape...clear input. Hit escape against, clear context.

    render() {
        return (
            <div className="w-full h-screen">
                <EditorBox
                    onSubmit={this.onBuildHyperEdge.bind(this)}
                    hyperedge={this.state.hyperedge}
                    setHyperedge={this.handleHyperedgeChange.bind(this)}
                />
                <Graph
                    data={this.data}
                    layout={this.state.layout}
                    onSelectNode={this.onSelectNode.bind(this)}
                />
                <Layout setLayout={this.setLayout.bind(this)} />
            </div>
        );
    }
}
*/

/*
export default function App() {
    console.log("LOADING");

    const [hypergraph, setHypergraph] = useState({});
    const [scratchMode, setScratchMode] = useState(false);
    const [scratchHypergraph, setScratchHypergraph] = useState({});

    const data = scratchMode ? Object.values(scratchHypergraph) : Object.values(hypergraph);

    const [layout, setLayout] = useState({
        name: "fcose",
        padding: 50
        // name: "fcose",
        // quality: "proof",
        // randomize: false
    });

    useEffect(() => {
        if (data.length > 0) {
            console.log("UPDATE DATA");
            update();
        }
    }, [data]);

    useEffect(() => {
        console.log("START");
        reload();
    }, []);

    function update() {
        console.log("UPDATE LAYOUT");
        window.ht_cy.layout(layout).run();
    }

    async function reload() {
        console.log("RELOAD");
        const data = await window.api.hypergraph.all();
        console.log("RELOAD DATA", data.length);
        addToHypergraph(data);
    }

    function handleSelectNode(symbol) {
        console.log("SELECTED NODE AT SYMBOL", symbol);
    }

    function addToHypergraph(obj) {
        console.log("ADD TO HYPERGRAPH", obj);
        if (typeof obj === "string") {
            console.log("ADDING SYMBOL");
            // symbol
            setScratchHypergraph({
                ...scratchHypergraph,
                [obj]: { data: { id: obj, label: obj } }
            });
            setHypergraph({ ...hypergraph, [obj]: { data: { id: obj, label: obj } } });
            return;
        } else if (Array.isArray(obj)) {
            console.log("ADDING HYPEREDGES", obj.length);
            if (!Array.isArray(obj[0])) {
                obj = [obj];
            }

            const newHypergraph = { ...hypergraph };
            const newScratchHypergraph = { ...scratchHypergraph };

            for (const hyperedge of obj) {
                let lastNode = null;
                for (const node of hyperedge) {
                    newHypergraph[node] = { data: { id: node, label: node } };
                    newScratchHypergraph[node] = { data: { id: node, label: node } };

                    if (lastNode) {
                        const id = `${lastNode}-${node}`;
                        newHypergraph[id] = { data: { id, source: lastNode, target: node } };
                        newScratchHypergraph[id] = { data: { id, source: lastNode, target: node } };
                    }
                    lastNode = node;
                }
            }

            setHypergraph(newHypergraph);
            setScratchHypergraph(newScratchHypergraph);
        }
    }

    // Clear context when creating a new node...then bring in relevant background nodes/edges as needed
    // Keep track of hypergraph when adding, don't always clear it away....
    // TODO: Auto complete

    // TODO: It's not a hypergraph viewer, it's a hyperedge viewer (for now)
    // TODO: There's always context (either a node or a hyperedge), and that context disconnects the hyperedges into their own strands. This detangles the hypergraph

    // TODO: Do incremental layout updates
    // TODO: By adding graph as you add the node, the graph is less janky
    // TODO: See what else is out there...what am I missing?
    async function handleAdd(obj) {
        // TODO: juse use setState so that you can use callbacks?

        if (!scratchMode) {
            // TODO: why isnt this working?
            console.log("SCRATCH MODE");
            setScratchHypergraph({});
            setScratchMode(true);
        }
        addToHypergraph(obj);
        // await window.api.hypergraph.add(obj);
    }

    return (
        <div className="w-full h-screen">
            <EditorBox add={handleAdd} />
            <Graph data={data} layout={layout} onSelectNode={handleSelectNode} />;
            <Layout setLayout={setLayout} setScratchMode={setScratchMode} />
        </div>
    );
}

*/
