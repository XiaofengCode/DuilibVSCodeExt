const vscode = require('vscode');
var xml2js = require("xml2js");
var fs = require("fs");

var controls=[];
var controlsAttrs;
const tags = [
    "Window",
    "ChildLayout",
    "Control",
    "Container",
    "VerticalLayout",
    "HorizontalLayout",
    "TileLayout",
    "TabLayout",
    "SliderTabLayout",
    "ActiveX",
    "WebBrowser",
    "Combo",
    "Label",
    "Button",
    "Option",
    "CheckBox",
    "Text",
    "Progress",
    "ProgressButton",
    "Slider",
    "Edit",
    "ScrollBar",
    "List",
    "ListHeader",
    "ListHeaderItem",
    "ListLabelElement",
    "ListTextElement",
    "ListElement",
    "ListContainerElement",
    "RichEdit",
    "TreeView",
    "TreeNode",
    "GifAnim",
    "DateTime",
    "IPAddressUI",
    "Menu",
    "MenuElement",
    "ChildWindow",
    "Include",
    "Font",
    "Default",
    "Image"
];
const attrWindow=[
    "alpha",
    "bktrans",
    "caption",
    "defaultfontcolor",
    "disabledfontcolor",
    "gdiplustext",
    "linkfontcolor",
    "linkhoverfontcolor",
    "maxinfo",
    "mininfo",
    "roundcorner",
    "selectedcolor",
    "shadowcolor",
    "shadowcorner",
    "shadowdarkness",
    "shadowimage",
    "shadowposition",
    "shadowsharpness",
    "shadowsize",
    "showdirty",
    "showshadow",
    "size",
    "sizebox",
    "stringtable",
    "stringtablelang",
    "titile",
    "trayiconid",
    "traytiptext"
];


const attrs = {
    "Window": attrWindow
}
var curCtrol = "";
var docText = "";
/**
 * 自动完成控件
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 * @param {*} context 
 */
function provideCompletionItems(document, position, token, context) {
    if (context.triggerCharacter == "<")
    {
        // 只截取到光标位置为止，防止一些特殊情况
	    const line		= document.lineAt(position);
        const lineText = line.text.substring(0, position.character);
        //console.log(lineText);
        if (/<$/.test(lineText)) {
            curCtrol = "";
            console.log(lineText);
            return controls.map(dep => {
                // vscode.CompletionItemKind 表示提示的类型
                return new vscode.CompletionItem(dep, vscode.CompletionItemKind.Field);
            })
        }
        return;
    }
    if (context.triggerCharacter == " ")
    {
        var curTextRange = new vscode.Range(new vscode.Position(0, 0), position);
        docText = document.getText(curTextRange);
        var rec = /[\s\S]*<\s*(\w+)\s*(\s*([\w-]+)\s*=\s*((\"[^\"]*\")*)|('[^\']*')*)*\s*$/gi;
        var control = rec.exec(docText);
        if (control.length > 2) {
            curCtrol = control[1];
            // var re = new RegExp("[\\s\\S]*<\\s*" + curCtrol + "\\s*(\\s*([\\w-]+)?\\s*=\\s*((\\\"[^\\\"]*\\\")*)|('[^\\']*')*)*\\s*$", 'i');
            // attrs = re.exec(docText);
            var res = [];
            ctl = curCtrol;
            while (ctl.length > 0){
                var x = controlsAttrs.Controls[ctl];
                var items = x[0].Attribute.map(dep => {
                    // vscode.CompletionItemKind 表示提示的类型
                    var completionItem = new vscode.CompletionItem(dep.$.name);
                    completionItem.kind = vscode.CompletionItemKind.Snippet;
                    completionItem.detail = dep.$.comment;
                    completionItem.insertText = dep.$.name + "=\"" + dep.$.default + "\"";
                    return completionItem;
                });
                res = res.concat(items);
                ctl = x[0].$.parent;
            }
            return res;
        }
        return;
    }
}

/**
 * 自动完成lua方法
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 * @param {*} context 
 */
function provideCompletionLua(document, position, token, context) {
	const line		= document.lineAt(position);

	// 只截取到光标位置为止，防止一些特殊情况
    const lineText = line.text.substring(0, position.character);
    console.log(lineText);
    if (/<$/.test(lineText)) {
        curCtrol = "";
        return tags.map(dep => {
			// vscode.CompletionItemKind 表示提示的类型
			return new vscode.CompletionItem(dep, vscode.CompletionItemKind.Field);
		})
    }
    const curPos = document.offsetAt(position);
    curTextRange = new vscode.Range(new vscode.Position(0, 0), position);
    docText = document.getText(curTextRange);
    if (/[\s\S]*<\s*Window\s*(\s*[\w-]+\s*=\s*((\"[^\"]*\")*)|('[^\"]*')*)*\s*$/i.test(docText)) {
        console.log("Test:" + lineText);
        curCtrol = "Window";
        return attrWindow.map(dep => {
			// vscode.CompletionItemKind 表示提示的类型
			return new vscode.CompletionItem(dep, vscode.CompletionItemKind.Field);
		})
    }
	// 简单匹配，只要当前光标前的字符串为`this.dependencies.`都自动带出所有的依赖
	if(/(^|=| )\w+\.$/g.test(lineText)) {
		const json = require(`${projectPath}/package.json`);
		const dependencies = Object.keys(json.dependencies || {}).concat(Object.keys(json.devDependencies || {}));
		return dependencies.map(dep => {
			// vscode.CompletionItemKind 表示提示的类型
			return new vscode.CompletionItem(dep, vscode.CompletionItemKind.Field);
		})
	}
}

/**
 * 光标选中当前自动补全item时触发动作，一般情况下无需处理
 * @param {*} item 
 * @param {*} token 
 */
function resolveCompletionItem(item, token) {
	return null;
}
exports.activate = function(context) {
    console.log('dui扩展激活！');
    fs.readFile(context.extensionPath + "/DuiLib.xml", "utf-8", function(errors, content){
        if(null !== errors ){
            console.log(errors)
            return;
        }
        xml2js.parseString(content, function(errors, response){
            if(null !== errors ){
                console.log(errors)
                return;
            }
            controlsAttrs = response;
            for (obj in response.Controls)
            {
                controls.push(obj);
            }
        });
    });
	context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            [
                'dui',
                'xml'
            ],
            {
                provideCompletionItems,
                resolveCompletionItem
            },
            '<'
        )
    );
	context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            [
                'dui',
                'xml'
            ],
            {
                provideCompletionItems,
                resolveCompletionItem
            },
            ' '
        )
    );
};
/**
 * 插件被释放时触发
 */
exports.deactivate = function() {
};