/**
 * The expression calculator
 * 
 * @author Malik Zharykov <cmalikz.h@gmail.com>
 * @license MIT
 */
const Compute = function (expression, functions, variables) {
  functions = functions || {};
  variables = variables || {};
  
  // Если пришло пустое выражение, то начинаем быковать
  if (typeof expression != 'string') {
  	console.error("Empty expression given");
    return;
  }
  
  
  // Производим лексический анализ
  let tokens = [];
  let i = 0;
  let tmp = '';
  let binaryOperators = ['SUM', 'SUB', 'MUL', 'DIV', 'MOD', 'POW'];
  
  for (;;) {
  	tmp = '';
  
  	if (expression.charAt(i) == "") break;
  
    switch (expression.charAt(i)) {
      case '*':
        tokens.push({ token: 'MUL' })
          ++i;
        break;
      case '/':
        tokens.push({ token: 'DIV' })
          ++i;
        break;
      case '+':
        tokens.push({ token: 'SUM' })
          ++i;
        break;
      case '-':
        tokens.push({ token: 'SUB' })
          ++i;
        break;
      case '%':
        tokens.push({ token: 'MOD' })
          ++i;
        break;
      case '^':
        tokens.push({ token: 'POW' })
          ++i;
        break;
      case '(':
        tokens.push({ token: 'LBR' })
          ++i;
        break;
      case ')':
        tokens.push({ token: 'RBR' })
          ++i;
        break;
      case ',':
        tokens.push({ token: 'COMMA' })
          ++i;
        break;
        
      case ' ':
      case "\r":
      case "\n":
      	++i;
        continue;
      
      default:

        // Обрабатываем число + число с точкой
        while ( (/^\d$/).test(expression.charAt(i)) || (tmp.length > 0 && expression.charAt(i) == '.' && tmp.indexOf('.') == -1) ) {
        	tmp += expression.charAt(i);
          ++i;
        }
        
        // Если tmp не пуст, значит мы получили число
        if (tmp.length > 0) {
        	tokens.push({token:'NUMBER', value: tmp});
        	continue;
        }
        
        // Выполнение дойдёт сюда только в случае, если символ это не оператор и не число, проверяем, мб это переменная
        
        
        while ((/^[a-z_]$/i).test(expression.charAt(i)) || (tmp.length > 0 && (/^\d$/i).test(expression.charAt(i)))) {
        tmp += expression.charAt(i);
        ++i;
        }
        
        if (tmp.length > 0) {
        	tokens.push({token:'VARIABLE', value: tmp});
          continue;
        }
        
        // Если это не то и не это, выдаем ошибку
        console.error('Invalid symbol: "' + expression.charAt(i) + '"');
        return;
    }
  }
  
  
  // Далее, после токенизации выполняем синтаксический анализ и сразу рассчёт
  // Анализ реализуется простеньким LL парсером
  const Parser = {
  	BinaryOperator: function (operators, ValueFunc, CalcFunc, right_assoc) {    
    	let result = ValueFunc();
      
      if (result === false) {
      	return false;
      }
      
      if (!right_assoc) { // Лево-ассоцитвное вычисление
      	while (i < tokens.length) { 
          if (operators.indexOf(tokens[i].token) == -1 ) {
            return result;
          }

          let op = tokens[i++].token;

          let right = this.MulDivModValue();
          
          if (right === false || right === null) {
            return right;
          }

          result = Number(CalcFunc(op, result, right));
        }
      } else { // Право-ассоциативное вычисление
      	if (operators.indexOf(tokens[i].token) == -1 ) {
        	return result;
        }

        let op = tokens[i++].token;
        
        let right = this.BinaryOperator(ValueFunc(), CalcFunc(), right_assoc);
        
        if (right === false || right === null) {
        	return right;
        }
        
        result = Number(CalcFunc(op, result, right));
      }
      
      
      
      return result;
    },
  
  	ScalarValue: function() {
      let va = false;

      if (tokens[i].token === 'NUMBER') {
        return Number(tokens[i++].value);
      }
      else if (tokens[i].token === 'SUM') {
      	++i;
      	return this.BracketValue();
      }
      else if (tokens[i].token === 'SUB') {
        ++i;
        va = this.BracketValue();
        
        if (va === false || va === null) {
        	return va;
        }
        
        return -va;
      }
      else if (tokens[i].token === 'VARIABLE') {
        if (variables[tokens[i].value] === undefined) {
          console.error("Undefined variable: '" + tokens[i].value + "'");
          return null;
        }
        return Number(variables[tokens[i++].value]);
      } else {
      	return false;
      }
    },
    
    FuncValue: function () {
      if ( !(i + 1 < tokens.length && tokens[i].token === 'VARIABLE' && tokens[i+1].token === 'LBR') ) {
      	return this.ScalarValue();
      }
      
      let funcname = tokens[i].value;
      
      i += 2; // пропускаем funcname(
      
      
      let args = [];
      
      while (true) {
      	if (tokens[i].token === 'RBR') {
        	++i;
        	break;
        }
      
      	let arg = this.SumSubValue();
        
        if (arg === false || arg === null) {
        	return arg;
        }
        
        args.push(arg);
        
        if (i >= tokens.length) {
        	return false;
        }
        
        if (tokens[i].token === 'COMMA') {
        	++i;
          continue;
        }
      }
      
      
      if (functions[funcname] === undefined) {
      	console.log("Undefined function call: " + funcname + "()");
        return null;
      }
      
      return Number(functions[funcname](args));
    },
    
    BracketValue: function () {
    	
      if (i >= tokens.length) {
      	return false;
      }
      
      if (tokens[i].token !== 'LBR') {
      	return this.FuncValue();
      }
      
      ++i;
      
      let result = this.SumSubValue();
      
      if (i >= tokens.length || tokens[i].token !== 'RBR') {
      	return false;
      }
      
      ++i;
      
      return result;
    },
    
    PowValue: function () {
      return this.BinaryOperator(['POW'], () =>  this.BracketValue() , function ( op, result, right) {
      	return (op === 'POW' ? Math.pow(result, right) : 0);
      }, false);
    },
    
    MulDivModValue: function () {
    	return this.BinaryOperator(['MUL', 'DIV', 'MOD'], () =>  this.PowValue() , function ( op, result, right) {
      	return (op === 'MUL' ? result * right : (op === 'DIV' ? result / right : (op === 'MOD' ? result % right : 0)));
      }, false);
    },
    
    SumSubValue: function () {
    	return this.BinaryOperator(['SUM', 'SUB'], () =>  this.MulDivModValue() , function ( op, result, right) {
      	return (op === 'SUM' ? result + right : (op === 'SUB' ? result - right : 0));
      }, false);
    }
    
  };
  
  i = 0;
  const result = Parser.SumSubValue();
  
  if (i !== tokens.length && result !== null ) {
  	console.error("Unexpected token: " + (i >= tokens.length ? 'END' : tokens[i].token));
  }
  
  if (result === false || result === null) {
  	return false;
  }
  
  return Number(result);
}
