import * as acorn from 'acorn';
import * as walker from 'acorn-walk';
import * as analyze from '@vuedx/analyze';

export interface AnalysisInfo {
  methods: Set<string>;
  trigger: Map<string, Set<string>>;
}

export function getAnalysis(sourceCode: string): AnalysisInfo {
  const methods: AnalysisInfo['methods'] = new Set(); // vue文件声明的方法
  const trigger: AnalysisInfo['trigger'] = new Map(); // key为方法名，value为触发该方法的函数
  const analyzer = analyze.createFullAnalyzer();

  try {
    const info = analyzer.analyze(sourceCode, 'Test.vue');
    const script = `let data = ${info.options?.properties.methods.loc.source}`;
    const ast = acorn.parse(script, {
      ecmaVersion: 'latest'
    });
    walker.ancestor(ast, {
      Property(node, ancestors) {
        // if (node.key.name === 'getHash') {
        //   console.log('方法层级：', ancestors.length)
        // }
        if (ancestors.length === 5) {
          methods.add(node.key.name);
        }
      }
    });
    walker.ancestor(ast, {
      CallExpression(node, ancestors) {
        const callee = node.callee;
        if (callee.object && callee.object.type === 'ThisExpression') {
          const callName = callee.property.name;
          // if (callName === 'showDuplicatedMessage') {
          //   callName;
          // }
          if (!methods.has(callName)) {return;}
          const bottomUp = ancestors.reversxe();
          for (let i = 0; i < bottomUp.length; i++) {
            const cur = bottomUp[i];
            const parent = bottomUp[i + 1];
            // 两种调用的AST结构情况，不知道为啥会有这种层级差异？
            const isTarget = (cur.type === 'FunctionExpression' && parent.type === 'Property' && methods.has(parent?.key.name)) ||
              (cur.type === 'Property' && cur?.value.type === 'FunctionExpression' && methods.has(cur?.key.name));
            if (isTarget) {
              // 函数/方法名称
              const functionName = parent.key ? parent.key.name : cur.key.name;
              if (trigger.has(callName)) {
                const list = trigger.get(callName);
                list?.add(functionName);
              } else {
                const list = new Set<string>();
                list.add(functionName);
                trigger.set(callName, list);
              }
              break;
            }
          }
        }
      }
    });
    return {
      methods,
      trigger,
    };
  } catch (err) {
    console.log(err);
    return {
      methods,
      trigger,
    };
  }
}
