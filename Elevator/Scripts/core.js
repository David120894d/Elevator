
//#region JSON Date

// Модификация сериализации и десериализация даты.
// Время в объекте Date и сериализованной строке будет одинаковое, т.е. без учета timezone, как при сериализации, так и после десериализации
(function ()
{
    var originToJSON = Date.prototype.toJSON;
    // переопределить оригинальную функцию обьекта Date
    Date.prototype.toJSON = function ()
    {
        var ticks = this.getTime();
        // сместить дату на величину временной зоны, чтобы в ticks стало значение в UTC
        // тогда на сервере дата десериализуется с тем же временем что и на клиенте, но с типом UTC
        ticks -= this.getTimezoneOffset() * 60000;

        return originToJSON.call(new Date(ticks));
    };



    var originParse = JSON.parse;
    var isoPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)/;

    // функция распарсивания текстового представления даты
    var dateReviver = function (key, value)
    {
        if (!value || typeof value !== "string") return value;

        var iso = isoPattern.exec(value);

        // если это дата в формате ISO
        //return iso ? new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5] + new Date().getTimezoneOffset(), +iso[6])) : value;// сдвинуть на timezone, чтобы полученное время было такое же, которое пришло с сервера
        return iso ? new Date(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +iso[6]) : value;// вроде работает и без такого сложного смещения
    };

    // переопределить оригинальную функцию обьекта JSON
    JSON.parse = function (text, reviver)
    {
        // если reviver не задан, использовать dateReviver для распарсивания дат
        return originParse.call(this, text, reviver ? reviver : dateReviver);
    };
})();

//#endregion



(function () {

    //Делаем core amdшным
    var core = new (function () {
        //#region is

        var isNU = function (obj) {
            /// <summary>
            /// Объект null или undefined
            /// </summary>
            /// <param name="obj" type="Object">объект</param>
            return (obj === void 0) || obj === null;
        };
        this.isNU = isNU;


        var isString = function (obj) {
            return Object.prototype.toString.call(obj) === "[object String]";
        };
        this.isString = isString;


        var isNumber = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Number]";
        };
        this.isNumber = isNumber;


        var isFunction = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Function]";
        };
        this.isFunction = isFunction;


        var isDate = function (obj) {
            return Object.prototype.toString.call(obj) === "[object Date]";
        };
        this.isDate = isDate;


        var isArray = Array.isArray || function (obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        };
        this.isArray = isArray;

        //#endregion


        //#region member

        var getMember = function (obj, name) {
            /// <summary>
            /// Получить значение элемента по его полному имени (например: member1.subMember1, member2[4].subMember1, member2[last].subMember1)
            /// </summary>
            /// <param name="obj" type="Object">объект, значение элемента, которого необходимо получить</param>
            /// <param name="name" type="String">имя элемента, значение которого необходимо получить</param>
            if (!obj || isNU(name)) return undefined;
            if (name === "") return obj;

            var current = obj;
            var names = name.replace(/\[(\d+|last)\]/gi, ".$1").split(/\./); // заменить "[1]" на ".1" и разбить на массив по "."
            var lastMark = "last";

            for (var i = 0, length = names.length; i < length; i++) {
                // получить имя текущего элемента
                name = names[i];
                if (!name) return undefined;

                // если это массив и необходима его последняя запись, получить её индекс
                if (current.length && name.toLowerCase() === lastMark) name = current.length - 1;

                // получить текущее значение
                current = current[name];

                if (isNU(current)) return undefined;
                else if ((i < (names.length - 1)) && isFunction(current)) current = current.call(this); // если этого функция-геттер, выполнить ее и значением считать ее результат
            }

            return current;
        };
        this.getMember = getMember;


        var arrayIndexPattern = /^\d+|\[last\]$/i;
        var setMemberResolver = function (c, p, n) {
            return n && n.match(arrayIndexPattern) ? [] : {};
        };

        this.setMember = function (obj, name, value, resolver) {
            /// <summary>
            /// Установить значение элемента
            /// </summary>
            /// <param name="obj" type="Object">объект, значение элемента, которого необходимо установить</param>
            /// <param name="name" type="String">имя элемента, значение которого необходимо установить</param>
            /// <param name="value" type="Object">требуемое значение</param>        
            /// <param name="resolver" type="Function" optional="true">вызывается, когда указанного элемента не существует, если не указан - создается новый объект, если указан false - выполнение прерывается</param>
            if (!obj || !name) return obj;

            var current = obj;
            var names = name.replace(/\[(\d+)\]|(\[last\])/gi, ".$1$2").split(/\./); // заменить "[1]" на ".1" и разбить на массив по "."
            var lastMark = "[last]";

            // получить способ разрешения конфликта по-умолчанию, если он не задан функцией или явно не указан в null
            if (!isFunction(resolver) && resolver !== false) {
                // создать пустой объект, если следующее имя число или "[last]" создается массив
                var arrayIndexPattern = /^\d+|\[last\]$/i;
                resolver = setMemberResolver;
            }

            var prevName;
            for (var i = 0, length = names.length; i < length; i++) {
                // получить имя текущего элемента
                name = names[i];
                if (!name) break;

                // если это массив и необходима его последняя запись, получить её индекс
                if (name.toLowerCase() === lastMark && !isNU(current.length)) name = current.length > 0 ? current.length - 1 : 0;

                if (i < (names.length - 1))// если не последний отрывок в имени
                {
                    // сохранить предыдущее значение
                    var prev = current;

                    // получить промежуточное значение
                    current = current[name];

                    if (current) continue; // продолжить если есть элемент
                    else if (!resolver) break; // выйти, если нет элемента и не задан способ разрешения конфликта

                    // разрешить конфликт, создать текущий элемент и добавить его в предыдущий
                    current = resolver.call(obj, name, prevName, names[i + 1]);

                    if (!current) break;
                    prev[name] = current;
                    prevName = name;
                }
                else {
                    // присвоить значение
                    current[name] = value;
                }
            }

            return obj;
        };

        //#endregion


        //#region string

        var formatIterator = function (ph, index, subFormat) {
            var arg = this[+index];
            if (isNU(arg)) return "";

            // преобразовать типы данных отличных от строки
            if (subFormat) {
                if (isDate(arg)) arg = core.formatDate(subFormat, arg);
                else if (isNumber(arg)) arg = core.formatNumber(subFormat, arg);
            }

            return !isNU(arg) ? arg : "";
        };

        this.format = function (format, args) {
            /// <summary>
            /// Отформатировать входную строку, последовательности вида {0}, {1} и т.п. заменяются соответствующими аргументами
            /// , так же допускается расширенный вариант: {0:#.##} - с форматом для чисел или {0:dd.mm.yy} - с форматом для дат
            /// </summary>
            /// <param name="format" type="String">форматируемая строка</param>
            /// <param name="args" type="Array">список аргументов форматирования, может быть задан как массивом, так и  последовательностью агрументов вызова</param>
            if (!isString(format)) return "";
            if (isNU(args) && arguments < 3) return format;

            // сделать из аргументов массив, если они им не являются
            if (!isArray(args)) args = Array.prototype.slice.call(arguments, 1);

            // форматировать строку для каждого аргумента
            for (var i = 0, length = args.length; i < length; i++) {
                format = format.replace(new RegExp("\\{(" + i + ")(?::([^}]*))?\\}", "gm"), formatIterator.bind(args));
            }

            return format;
        };


        this.trim = function (text) {
            /// <summary>
            /// Обрезать строку по краям
            /// </summary>
            /// <param name="text" type="String">обрезаемая строка</param>
            var empty = "";
            return !isNU(text) ? (String.prototype.trim ? String.prototype.trim.call(text) : text.toString().replace(/^[\s\xA0]+/, empty).replace(/[\s\xA0]+$/, empty)) : empty;
        };

        //#endregion


        //#region number

        this.formatNumber = function (format, value) {
            /// <summary>
            /// Преобразовать число в строку с форматированием
            /// </summary>
            /// <param name="format" type="String">формат числа (D{число}: 10 -> D3 -> 010 , N{число}: 1.123 -> N1 -> 1.1, #{число} 0.01 -> #1 -> "", P: 10 -> 10%, C: 10 -> $10)</param>
            /// <param name="args" type="Number">значение</param>
            if (!isNumber(value)) return value ? value.toString() : "";

            var nf = {
                CurrencyDecimalDigits: 2,
                CurrencyDecimalSeparator: ".",
                CurrencyGroupSeparator: " ",
                CurrencyGroupSizes: [3],
                CurrencyNegativePattern: 0,
                CurrencyPositivePattern: 0,
                CurrencySymbol: "$",

                NegativeSign: "-",
                NumberDecimalDigits: 2,
                NumberDecimalSeparator: ".",
                NumberGroupSeparator: " ",
                NumberGroupSizes: [3],
                NumberNegativePattern: 1,

                PercentDecimalSeparator: ".",
                PercentGroupSeparator: " ",
                PercentGroupSizes: [3],
                PercentNegativePattern: 0,
                PercentPositivePattern: 0,
                PercentSymbol: "%"
            };

            //#region support

            var percentPositivePattern = ["n %", "n%", "%n"];
            var percentNegativePattern = ["-n %", "-n%", "-%n"];
            var numberNegativePattern = ["(n)", "-n", "- n", "n-", "n -"];
            var currencyPositivePattern = ["$n", "n$", "$ n", "n $"];
            var currencyNegativePattern = ["($n)", "-$n", "$-n", "$n-", "(n$)", "-n$", "n-$", "n$-", "-n $", "-$ n", "n $-", "$ n-", "$ -n", "n- $", "($ n)", "(n $)"];

            var zeroPad = function (str, count, left) {
                for (var l = str.length; l < count; l++) {
                    str = (left ? ('0' + str) : (str + '0'));
                }
                return str;
            };

            var expandNumber = function (number, precision, groupSizes, sep, decimalChar) {
                var curSize = groupSizes[0];
                var curGroupIndex = 1;
                var factor = Math.pow(10, precision);
                var rounded = (Math.round(number * factor) / factor);
                if (!isFinite(rounded)) rounded = number;
                number = rounded;

                var numberString = number.toString();
                var right = "";
                var exponent;


                var split = numberString.split(/e/i);
                numberString = split[0];
                exponent = (split.length > 1 ? parseInt(split[1]) : 0);
                split = numberString.split('.');
                numberString = split[0];
                right = split.length > 1 ? split[1] : "";

                var l;
                if (exponent > 0) {
                    right = zeroPad(right, exponent, false);
                    numberString += right.slice(0, exponent);
                    right = right.substr(exponent);
                }
                else if (exponent < 0) {
                    exponent = -exponent;
                    numberString = zeroPad(numberString, exponent + 1, true);
                    right = numberString.slice(-exponent, numberString.length) + right;
                    numberString = numberString.slice(0, -exponent);
                }
                if (precision > 0) {
                    right = decimalChar + ((right.length > precision) ? right.slice(0, precision) : zeroPad(right, precision, false));
                }
                else {
                    right = "";
                }
                var stringIndex = numberString.length - 1;
                var ret = "";
                while (stringIndex >= 0) {
                    if (curSize === 0 || curSize > stringIndex) {
                        if (ret.length > 0)
                            return numberString.slice(0, stringIndex + 1) + sep + ret + right;
                        else
                            return numberString.slice(0, stringIndex + 1) + right;
                    }
                    if (ret.length > 0)
                        ret = numberString.slice(stringIndex - curSize + 1, stringIndex + 1) + sep + ret;
                    else
                        ret = numberString.slice(stringIndex - curSize + 1, stringIndex + 1);
                    stringIndex -= curSize;
                    if (curGroupIndex < groupSizes.length) {
                        curSize = groupSizes[curGroupIndex];
                        curGroupIndex++;
                    }
                }
                return numberString.slice(0, stringIndex + 1) + sep + ret + right;
            };

            //#endregion

            var number = Math.abs(value);
            if (!format) format = "D";
            var precision = -1;
            if (format.length > 1) precision = parseInt(format.slice(1), 10);
            var pattern;
            switch (format.charAt(0)) {
                case "d":
                case "D":
                    pattern = 'n';
                    if (precision !== -1) {
                        number = zeroPad("" + number, precision, true);
                    }
                    if (value < 0) number = -number;
                    break;
                case "c":
                case "C":
                    if (value < 0) pattern = currencyNegativePattern[nf.CurrencyNegativePattern];
                    else pattern = currencyPositivePattern[nf.CurrencyPositivePattern];
                    if (precision === -1) precision = nf.CurrencyDecimalDigits;
                    number = expandNumber(number, precision, nf.CurrencyGroupSizes, nf.CurrencyGroupSeparator, nf.CurrencyDecimalSeparator);
                    break;
                case "n":
                case "N":
                    if (value < 0) pattern = numberNegativePattern[nf.NumberNegativePattern];
                    else pattern = 'n';
                    if (precision === -1) precision = nf.NumberDecimalDigits;
                    number = expandNumber(number, precision, nf.NumberGroupSizes, nf.NumberGroupSeparator, nf.NumberDecimalSeparator);
                    break;
                case "p":
                case "P":
                    if (value < 0) pattern = percentNegativePattern[nf.PercentNegativePattern];
                    else pattern = percentPositivePattern[nf.PercentPositivePattern];
                    if (precision === -1) precision = nf.PercentDecimalDigits;
                    number = expandNumber(number * 100, precision, nf.PercentGroupSizes, nf.PercentGroupSeparator, nf.PercentDecimalSeparator);
                    break;
                case "#":
                    if (value < 0) pattern = numberNegativePattern[nf.NumberNegativePattern];
                    else pattern = 'n';
                    if (precision === -1) precision = nf.NumberDecimalDigits;

                    var frac = +(Math.abs(value) - Math.floor(Math.abs(value))).toFixed(6);
                    var fracPrecision = frac ? (frac.toString().length - 2) : 0;
                    number = Math.round(Math.abs(value) * Math.pow(10, precision)) !== 0 ? expandNumber(number, fracPrecision < precision ? fracPrecision : precision, nf.NumberGroupSizes, nf.NumberGroupSeparator, nf.NumberDecimalSeparator) : "";
                    break;
                default:
                    return value.toString();
            }

            var regex = /n|\$|-|%/g;
            var ret = "";
            for (; ;) {
                var index = regex.lastIndex;
                var ar = regex.exec(pattern);
                ret += pattern.slice(index, ar ? ar.index : pattern.length);
                if (!ar)
                    break;
                switch (ar[0]) {
                    case "n":
                        ret += number;
                        break;
                    case "$":
                        ret += nf.CurrencySymbol;
                        break;
                    case "-":
                        if (/[1-9]/.test(number)) {
                            ret += nf.NegativeSign;
                        }
                        break;
                    case "%":
                        ret += nf.PercentSymbol;
                        break;
                    default:
                        break;
                }
            }
            return ret;
        };

        //#endregion


        //#region date format/parse -> momentjs

        this.formatDate = function (format, value) {
            return window.moment ? moment(value).format(format || core.res.date.format) : value;
        };

        //#endregion


        //#region list

        this.findIndex = function (list, predicate, context) {
            /// <summary>
            /// use until ES6: Получить индекс элемента, для которого выполняется условие
            /// </summary>
            var length = list.length >>> 0;
            var value;

            for (var i = 0; i < length; i++) {
                if (i in list) {
                    value = list[i];
                    if (predicate.call(context || list, value, i, list)) {
                        return i;
                    }
                }
            }
            return -1;
        };


        this.find = function (list, predicate, context) {
            /// <summary>
            /// use until ES6: Первый элемент, для которого выполняется условие
            /// </summary>
            var index = core.findIndex(list, predicate, context);
            return index !== -1 ? list[index] : undefined;
        };


        this.mapMember = function (list, selector, context) {
            /// <summary>
            /// Получить преобразованный список
            /// </summary>
            /// <param name="list" type="Array"></param>
            /// <param name="selector" type="String">имя требуемого свойства</param>
            /// <param name="context" type="Object" optional="true"></param>
            return Array.prototype.map.call(list, function (i) { return getMember(i, selector); }, context);
        }


        this.last = function (list, predicate, context) {
            /// <summary>
            /// Последний элемент, для которого выполняется условие
            /// </summary>
            /// <param name="list" type="Array"></param>
            /// <param name="predicate" type="Function" optional="true"></param>
            /// <param name="context" type="Object" optional="true"></param>
            return (isFunction(predicate) ? list = list.filter(predicate, context) : list)[list.length - 1];
        };

        //#endregion


        //#region ajax  

        (function () {
            var getError = function (xhr, status) {
                /// <summary>
                /// Получить объект ошибки после неудачного выполнения ajax-запроса, отправленный в JSON сервером или же ошибку по-умолчанию  
                /// </summary>
                /// <param name="xhr" type="Object"></param>
                /// <param name="status" type="String"></param>

                // получить объект ошибки или имя ресурса сообщения
                var error, errorText;
                switch (status) {
                    case "abort":
                        errorText = "Abort";
                        break;
                    case "timeout":
                        errorText = "Timeout";
                        xhr.status = 408;
                        break;
                    case "parsererror":
                        errorText = "ResultExecution";
                        break;
                    default:
                        if (xhr.responseText) {
                            // распарсить JSON-ошибку переданную с сервера
                            var type = xhr.getResponseHeader("Content-Type");
                            if (isString(type) && type.indexOf("json") !== -1 && xhr.responseText) {
                                error = JSON.parse(xhr.responseText);
                                if (!error.name) error.name = "Error";
                            }
                        }

                        if (!error) errorText = xhr.status === 404 ? "NotFound" : "Unknown";
                        break;
                }

                // создать объект ошибки или ошибку по-умолчанию, и обнулить избыточное описание
                if (!error) {
                    var text = core.res.get("Exceptions." + errorText);
                    error = new Error(text ? text : errorText);
                }
                error.status = xhr.status;

                return error;
            };

            var errorHandler = function (xhr, status) {
                var callerArgs;
                // обернуть в try на случай strict mode
                try {
                    callerArgs = arguments.callee.caller.arguments[0];
                }
                catch (ex) {
                    return;
                }

                // получить ошибку
                var error = getError(xhr, status);

                // подменить ошибку в качестве 3-го аргумента в вызовах обработчиков ошибок
                if (callerArgs && callerArgs[1]) callerArgs[1][2] = error;
            };


            var beforeSendHandler = function (xhr, settings) {
                // сериализовать входные значения в JSON, если надо
                if (settings.data && (settings.contentType || "").indexOf("json") !== -1 && !isString(settings.data)) settings.data = JSON.stringify(settings.data);
            };


            var defaults = {
                type: "POST",
                contentType: "application/json",
                processData: false,
                timeout: 300000,
                beforeSend: beforeSendHandler
            };

            this.ajax = function (settings) {
                /// <summary>
                /// shortcut для ajax-запросов с предустановленными входными значениеми и обработкой ошибок, 
                /// упрощающий типичный вызов сервиса
                /// </summary>
                /// <param name="settings" type="Object">jQuery Ajax request settings</param>

                // установить настройки по-умолчанию, и сериализацию данных перед отправкой
                settings = $.extend(settings, defaults);

                // установить обработчик ошибок первым с списке 
                if (!settings.error) settings.error = [];
                else if (!isArray(settings.error)) settings.error = [settings.error];
                settings.error.unshift(errorHandler);

                return $.ajax(settings);
            };

        }).call(this);

        //#endregion


        //#region expressions

        this.expressions = function () {
            var keys = [];
            var exprs = [];
            var extensionPattern = /#(\w+)\(/g;
            var extensionReplace = "this.$1(";
            var template = "return {0};\nvar $, _, ActiveXObject, addEventListener, alert, attachEvent, confirm, constructor, document, eval, frameElement, frames, Function, history, jQuery, location, navigator, open, opener, parent, prompt, prototype, screen, ScriptEngine, self, setInterval, setTimeout, stack, top, valueOf, watch, window, XMLHttpRequest;";

            return {
                parse: function (expression, argsCount, throwEx) {
                    /// <summary>
                    /// Распарсить выражение из строкового представления
                    /// </summary>
                    /// <param name="expression" type="String">выражение в строковом представлении (например: arg1 > arg2 && arg1 < 5)</param>
                    /// <param name="argsCount" type="Number">количество аргументов выражения</param>
                    /// <param name="throwEx" optional="True" type="Boolean">зажигать ли исключения</param>
                    if (!isString(expression)) return expression;

                    // определить количество аргументов
                    if (!isNumber(argsCount) || argsCount < 1) argsCount = 0;
                    else if (argsCount > 100) argsCount = 100;

                    // получить выражение из кеша
                    var key = expression + argsCount;
                    var index = keys.indexOf(key);
                    if (index !== -1) return exprs[index];

                    // получить сигнатуру вызова выражения
                    var signature = [];
                    for (var i = 0; i < argsCount; i++) signature.push("arg" + (i + 1));

                    // сформировать тело выражения и преобразовать вызовы функций-расширений
                    expression = expression.replace(extensionPattern, extensionReplace);

                    // получить функцию выражения из строкового представления
                    try {
                        expression = new Function(signature, core.format(template, expression));
                    }
                    catch (ex) {
                        if (throwEx) throw ex;
                        return;
                    }

                    // сохранить выражение в кеше
                    keys.push(key);
                    exprs.push(expression);

                    return expression;
                },
                invoke: function (expression, args, throwEx) {
                    /// <summary>
                    /// Выполнить выражение в строковом представлении и получить результат
                    /// </summary>
                    /// <param name="expression" type="Function">выражение в строковом представлении вида (например: arg1 > arg2 && arg1 < 5)</param>
                    /// <param name="args" type="Array">список аргументов выражения</param>
                    /// <param name="throwEx" optional="True" type="Boolean">зажигать ли исключения</param>

                    // распарсить выражение
                    expression = core.expressions.parse(expression, args ? args.length : undefined, throwEx);
                    if (!isFunction(expression)) return;

                    // выполнить выражение
                    try {
                        return expression.apply(core.expressions.extender, args);
                    }
                    catch (ex) {
                        if (throwEx) throw ex;
                        return;
                    }
                },
                extender: { // набор функций расширяющих выражения
                    IsDefault: function (value) {
                        return value ? (value.hasOwnProperty("length") ? !value.length : false) : true;
                    },
                    Count: function (value) {
                        return value && value.length ? value.length : 0;
                    },
                    Contains: function (obj, value) {
                        return obj && (isString(obj) ? obj.indexOf(value) : (isArray(obj) ? obj.indexOf(value) !== -1 : false));
                    }
                }
            };
        }();

        //#endregion


        //#region resources

        // для хранения строковых ресурсов и адресов сервисов
        this.res = {
            language: null,
            get: function (name, formatArgs) {
                var empty = "";
                if (!isString(name)) return empty;

                // получить контекст для поиска ресурсов, по-умолчанию это текущий объект
                var index = name.indexOf(",");
                var context = index === -1 ? this : getMember(name.substr(0, index));

                // получить ресурс
                var resource = getMember(context, name.substr(index + 1));

                // произвести форматирование если надо
                return resource ? (formatArgs ? core.format(resource, formatArgs) : resource) : empty;
            },
            urls: {}
        };

        //#endregion


        //#region uuid

        this.uuid = (function () {
            var avalChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

            return function (len, radix) {
                ///	<summary>
                ///	Создать уникальный идентификатор
                ///	</summary>
                ///	<param name="len" type="Number">длина идентификатора</param>
                ///	<param name="radix" type="Number"></param>
                /// <returns type="String"/>
                var chars = avalChars, uuid = [], rnd = Math.random;
                radix = radix || chars.length;

                if (len) {
                    // Compact form
                    for (var i = 0; i < len; i++) uuid[i] = chars[0 | rnd() * radix];
                }
                else {
                    // rfc4122, version 4 form
                    var r;

                    // rfc4122 requires these characters
                    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                    uuid[14] = '4';

                    // Fill in random data.  At i==19 set the high bits of clock sequence as
                    // per rfc4122, sec. 4.1.5
                    for (var i = 0; i < 36; i++) {
                        if (!uuid[i]) {
                            r = 0 | rnd() * 16;
                            uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
                        }
                    }
                }

                return uuid.join('');
            };
        })();

        //#endregion


        //#region ui

        this.ui = {
            isWithin: function (current, parent) {
                ///	<summary>
                /// Находится ли элемент внутри контейнера
                ///	</summary>
                ///	<param name="current" type="DOMElement">текущий элемент</param>
                ///	<param name="parent" type="DOMElement">предполагаемый родитель</param>
                /// <returns type="Boolean"/>
                while (current) {
                    if (current === parent) return true;
                    current = current.parentNode;
                }
                return false;
            }
        };

        //#endregion

    })();

    if (typeof define === 'function' && define.amd) {
        define("core", [], function () { return core; });
        ////оставим для отправки ViewModel
        //window.core = {};
    }
        //если не amd возвращаемся к глобальным переменным
    window.core = core;


})();


//Делаем core amdшным

/*
alert((function () { "use strict"; return !this; })());
*/
