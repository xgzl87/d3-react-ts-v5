import * as $ from "jquery";
import {IInitTreeParams} from "../interfaces/InitTreeParams";

declare let window: any;
export const initParams = (option: IInitTreeParams) => {
    const defaultOpt = {
        width: 900,
        height: 900,
        offsetTreeH: 300,// 影响树形横向的区域
        nodeHeight: 0,// 节点rect高度
        nodeWidth: {// 传参为null就按字数设置宽度
            _0: 90,
            _1: 90,
            _2: 90,
            _3: 100,
            _4: 90
        },// 默认节点宽度
        selector: null,// 挂载元素
        fontNum: 1.2,// 设置字体大小因子
        fontColors: {// 字体颜色
            normal: '#000',
            warning: '#e3e3e1',
            errors: '#f00'
        },
        bgColors: {
            normal: '#DCE6F2',
            warning: '#e3e3e1',
            errors: '#f00'
        },
        dataUrl: '' // 必填
    };

    option = $.extend(true, defaultOpt, option);

    return option;
};

// 判断浏览器是否支持svg
export const isSupportSVG = () => {
    const svgNs = 'http://www.w3.org/2000/svg';
    return !!window.document.createElementNS && !!window.document.createElementNS(svgNs, 'svg').createSVGRect;
};

// 获取树结构的数据
export const getTreeJsonData = () => {
    return {
        "name": "思辨-储备",
        "number": "12",
        "type": "1",
        "children":
            [
                {
                    "name": "产品节奏",
                    "number": "3",
                    "value": 100,
                    "type": "1",
                    "children":
                        [
                            {
                                "name": "2019 上半年",
                                "nodeWidth": "80",
                                "number": "381",
                                "type": "1",
                                "children":
                                    [
                                        {
                                            "name": "Web 前端",
                                            "number": "180",
                                            "type": "1"
                                        },
                                        {
                                            "name": "后端 (NodeJS)",
                                            "number": "145",
                                            "type": "1"
                                        }
                                    ]
                            },
                            {
                                "name": "2019 下半年",
                                "nodeWidth": "80",
                                "number": "121",
                                "type": "1",
                                "children": [{
                                    "name": "移动端开发人员",
                                    "nodeWidth": "105",
                                    "number": "1",
                                    "type": "1",
                                },
                                    {
                                        "name": "后端 (NodeJS)",
                                        "number": "1",
                                        "type": "1",
                                    },
                                    {
                                        "name": "文档解析",
                                        "number": "1",
                                        "nodeWidth": "70",
                                        "type": "1",
                                    },
                                    {
                                        "name": "复杂方案设计过程中的智能支持",
                                        "number": "1",
                                        "nodeWidth": "190",
                                        "type": "1",
                                    }]
                            }
                        ]
                },
                {
                    "name": "人员标准",
                    "number": "1",
                    "type": "1",
                    "value": 100,
                    "children":
                        [
                            {
                                "name": "技术有特长",
                                "number": "183",
                                "type": "1",
                                "value": 100
                            },
                            {
                                "name": "能够在南京工作或持续出差",
                                "nodeWidth": "190",
                                "number": "8",
                                "type": "1"
                            }
                        ]
                },
                {
                    "name": "技术需求",
                    "number": "1",
                    "type": "1",
                    "children":
                        [
                            {
                                "name": "图例",
                                "number": "183",
                                "type": "1",
                                "children":
                                    [
                                        {
                                            "name": "需要的",
                                            "number": "183",
                                            "type": "1"
                                        },
                                        {
                                            "name": "关注中, 可能需要的",
                                            "nodeWidth": "120",
                                            "number": "8",
                                            "type": "1"
                                        }
                                    ]
                            },
                            {
                                "name": "语言",
                                "number": "183",
                                "type": "1",
                                "children":
                                    [
                                        {
                                            "name": "JavaScript/TypeScript",
                                            "number": "183",
                                            "nodeWidth": "150",
                                            "type": "1"
                                        },
                                        {
                                            "name": "Python",
                                            "number": "8",
                                            "type": "1"
                                        }
                                    ]
                            }
                        ]
                }
            ]
    };
};