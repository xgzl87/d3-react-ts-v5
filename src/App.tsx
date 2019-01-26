import * as d3 from "d3";
import * as React from 'react';
import Tree from 'react-d3-tree';
import {getTreeJsonData, isSupportSVG} from "./utils/util";

// import {initParams} from "./interfaces/InitTreeParams"
export interface IProps {
    width: number;
    height: number;
    offsetTreeH: number;
    nodeHeight: number;
    nodeWidth?: number;
    fontColor?: string;
    pathColor?: string;
}

interface IState {
    width: number;
    height: number;
    duration: number;
    margin: {
        top: number,
        bottom: number,
        left: number,
        right: number
    };
    zoom: any;
    root: any;
    nodes: any;
    dTreeData: any;
    links: any;
}

class App extends React.Component<any, IState> {
    constructor(props: any) {
        super(props);
        this.getRoot = this.getRoot.bind(this);
        // @ts-ignore
        this.state = {
            width: 960,
            height: 600,
            duration: 750,
            margin: {
                top: 30,
                bottom: 0,
                left: 80,
                right: 0
            },
            zoom: null,
            root: null,
            nodes: [] as any,
            dTreeData: [] as any,
            links: [] as any
        };
    }

    public componentDidMount() {
        if (!isSupportSVG()) {
            console.log("浏览器不支持svg,请升级!");
            return;
        }
        // this.mounted();
    }

    public render() {
        //    console.log(this.getRoot());
        return (
            <div id="treeWrapper" style={{width: this.state.width + "px", height: this.state.height + "px"}}>
                <Tree data={getTreeJsonData()} separation={{siblings: 0.3, nonSiblings: 0.5}}/>
            </div>
        );
    }

    protected getRoot() {
        const root = d3.hierarchy(getTreeJsonData())
            .sum((d: any) => {
                return d.value;
            });
        return root
    }

    protected getNodesAndLinks() {
        // createTree generate new x、y coordinate according to root node,
        this.setState({dTreeData: this.createTree()(this.state.root)});
        this.setState({nodes: this.state.dTreeData.descendants(), links: this.state.dTreeData.descendants().slice(1)});
    }

    protected clickNode(d: any) {
        if (!d._children && !d.children) {
            return;
        }

        if (d.children) {
            d = Object.assign({}, d, {_children: d.children});
            // this.$set(d, '_children', d.children)
            d.children = null
        } else {
            d = Object.assign({}, d, {children: d._children});
            d._children = null
        }
        this.update(d);

    }


    protected update(source: any) {
        // @ts-ignore
        const svg = d3.select("svg");

        const g = svg.append("g")
            .attr("transform", "translate(" + this.state.margin.left + "," + this.state.margin.top + ")");

        const hierarchyData = source;

        // @ts-ignore
        const tree = d3.tree()
            .size([Number(this.state.width) - 400, Number(this.state.height) - 200])
            .separation((a, b) => {
                return (a.parent === b.parent ? 1 : 2) / a.depth;
            });

        const treeData = tree(hierarchyData);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // 输出节点和边

        const bezierCurveGenerator = d3.linkHorizontal()
            .x((d: any) => {
                return d.y;
            })
            .y((d: any) => {
                return d.x;
            });

        // 绘制边
        g.append("g")
            .selectAll("path")
            .data(links)
            .enter()
            .append("path")
            .attr("d", (d: any) => {
                const start = {x: d.source.x, y: d.source.y};
                const end = {x: d.target.x, y: d.target.y};
                // @ts-ignore
                return bezierCurveGenerator({source: start, target: end});
            })
            .attr("fill", "none")
            .attr("stroke", "yellow")
            .attr("stroke-width", 1);

        const gs = g.append("g")
            .selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", (d: any) => {
                const cx = d.x;
                const cy = d.y;
                return "translate(" + cy + "," + cx + ")";
            });

        // 绘制节点
        gs.append("circle")
            .attr("r", 6)
            .attr("fill", "white")
            .attr("stroke", "blue")
            .attr('pointer-events', 'mouseover')
            .attr("opacity", 0.2) // change this to zero to hide the target area
            .attr("stroke-width", 1)
            .on('click', (d) => {
                this.clickNode(d);
                console.log(d);
            });

        // 文字
        gs.append("text")
            .attr("x", (d: any) => {
                if (d.data && d.data.nodeWidth && d.children) {
                    return -d.data.nodeWidth;
                } else {
                    return d.children ? (d.data.name.length > 2 ? -60 : -40) : 8;
                }
            })
            .attr("y", -5)
            .attr("dy", 10)
            .text((d: any) => {
                return d.data && d.data.name;
            });
    }

    protected mounted() {
        // 创建svg画布
        this.update(this.state.root);
    }

    protected createTree() {
        return d3.tree()
            .size([this.state.height, this.state.width])
            .separation((a, b) => {
                return (a.parent === b.parent ? 1 : 2) / a.depth;
            });
    }
}

export default App;
