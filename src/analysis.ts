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
          if (!methods.has(callName)) {return;}
          const bottomUp = ancestors.reverse();
          for (let i = 0; i < bottomUp.length; i++) {
            const cur = bottomUp[i];
            const parent = bottomUp[i + 1];
            if (cur.type === 'FunctionExpression' && parent.type === 'Property' && methods.has(parent.key.name)) {
              if (trigger.has(callName)) {
                const list = trigger.get(callName);
                list?.add(parent.key.name);
              } else {
                const list = new Set<string>();
                list.add(parent.key.name);
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
