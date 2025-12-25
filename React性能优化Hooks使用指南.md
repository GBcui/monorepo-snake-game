# React 完整 Hooks 和性能优化指南

> 涵盖所有 React Hooks、API 和性能优化技术的完整参考手册

## React Hooks 全家桶速查

### 📊 基础 Hooks（所有版本）
- `useState` - 状态管理
- `useEffect` - 副作用处理
- `useContext` - 上下文消费

### 🎯 性能优化 Hooks
- `useMemo` - 缓存计算结果
- `useCallback` - 缓存函数引用
- `useReducer` - 复杂状态管理
- `React.memo` - 组件缓存

### 🔗 Ref 相关
- `useRef` - 引用存储
- `forwardRef` - Ref 转发
- `useImperativeHandle` - 自定义实例值

### ⚡ 副作用类
- `useEffect` - 异步副作用（默认）
- `useLayoutEffect` - 同步副作用
- `useInsertionEffect` - CSS-in-JS 优化

### 🆕 React 18 新增
- `useTransition` - 标记非紧急更新
- `useDeferredValue` - 延迟值更新
- `useId` - 生成唯一 ID
- `useSyncExternalStore` - 订阅外部数据源
- `startTransition` - 独立 transition API
- `flushSync` - 强制同步更新

### 🛠 其他工具
- `useDebugValue` - 自定义 Hook 调试
- `React.lazy` - 懒加载组件
- `Suspense` - 加载状态处理

---

## 目录

### 核心性能优化 Hooks
- [useMemo](#usememo)
- [useCallback](#usecallback)
- [React.memo](#reactmemo)
- [useTransition (React 18+)](#usetransition-react-18)
- [useDeferredValue (React 18+)](#usedeferredvalue-react-18)
- [useReducer 优化](#usereducer-优化)

### Ref 相关 API
- [useRef](#useref)
- [forwardRef](#forwardref)
- [useImperativeHandle](#useimperativehandle)

### 副作用 Hooks
- [useEffect vs useLayoutEffect](#useeffect-vs-uselayouteffect)
- [useInsertionEffect (React 18+)](#useinsertioneffect-react-18)

### React 18 新增 API
- [useId](#useid-react-18)
- [useSyncExternalStore](#usesyncexternalstore-react-18)
- [startTransition](#starttransition-react-18)
- [flushSync](#flushsync)

### 调试工具
- [useDebugValue](#usedebugvalue)

### 高级优化技术
- [React.lazy 和 Suspense](#reactlazy-和-suspense)
- [Context 优化](#context-优化)
- [虚拟化列表](#虚拟化列表)
- [防抖和节流](#防抖和节流)
- [代码分割策略](#代码分割策略)
- [其他优化技巧](#其他优化技巧)

### 实践指南
- [性能优化最佳实践](#性能优化最佳实践)
- [常见误区](#常见误区)
- [性能优化检查清单](#性能优化检查清单)

---

## React Hooks 执行顺序

### 🔄 组件渲染生命周期中的 Hook 执行顺序

```
1. 函数组件开始执行
   ├─ useState / useReducer（初始化或获取当前值）
   ├─ useMemo（根据依赖判断是否重新计算）
   ├─ useCallback（根据依赖判断是否重新创建）
   └─ 渲染 JSX
   
2. React 更新 DOM（commit 阶段）
   ├─ useInsertionEffect（在 DOM 变更前注入样式）
   ├─ DOM 变更生效
   ├─ useLayoutEffect（同步执行，阻塞绘制）
   └─ 浏览器绘制屏幕
   
3. 浏览器绘制后
   └─ useEffect（异步执行，不阻塞绘制）
```

### ⏱️ 副作用 Hooks 执行时机对比

```
组件渲染
    ↓
useInsertionEffect 🔴 (最早，CSS-in-JS)
    ↓
DOM 更新
    ↓
useLayoutEffect 🟡 (同步，阻塞绘制)
    ↓
浏览器绘制
    ↓
useEffect 🟢 (异步，不阻塞)
```

**选择建议**：
- 99% 情况使用 `useEffect`
- 需要测量 DOM 或避免闪烁时用 `useLayoutEffect`
- 开发 CSS-in-JS 库时用 `useInsertionEffect`

---

## useMemo

### 📌 作用
缓存**计算结果**，避免在每次渲染时重复执行昂贵的计算。

### ✅ 什么时候使用

#### 1. 复杂计算或数据转换
```tsx
const expensiveResult = useMemo(() => {
  // 耗时的计算
  return data.filter(...).map(...).reduce(...);
}, [data]);
```

#### 2. 避免创建新的对象/数组引用
```tsx
// ❌ 不好：每次渲染都创建新数组，导致子组件重新渲染
const options = [1, 2, 3].map(x => ({ value: x, label: `Item ${x}` }));

// ✅ 好：使用 useMemo 缓存
const options = useMemo(() => {
  return [1, 2, 3].map(x => ({ value: x, label: `Item ${x}` }));
}, []);
```

#### 3. 作为其他 Hook 的依赖项
```tsx
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// filteredData 作为依赖项时不会频繁变化
useEffect(() => {
  doSomething(filteredData);
}, [filteredData]);
```

### ❌ 什么时候不使用

#### 1. 简单的计算
```tsx
// ❌ 过度优化
const sum = useMemo(() => a + b, [a, b]);

// ✅ 直接计算即可
const sum = a + b;
```

#### 2. 原始值的计算
```tsx
// ❌ 不必要
const isActive = useMemo(() => status === 'active', [status]);

// ✅ 简单比较直接写
const isActive = status === 'active';
```

---

## useCallback

### 📌 作用
缓存**函数引用**，避免在每次渲染时创建新的函数实例。

### ✅ 什么时候使用

#### 1. 传递给使用了 React.memo 的子组件
```tsx
const Parent = () => {
  // ✅ 避免子组件不必要的重新渲染
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <MemoizedChild onClick={handleClick} />;
};

const MemoizedChild = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click me</button>;
});
```

#### 2. 作为 useEffect 的依赖项
```tsx
const fetchData = useCallback(async () => {
  const result = await api.getData(id);
  setData(result);
}, [id]);

useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData 不会频繁变化
```

#### 3. 防止自定义 Hook 中的函数频繁变化
```tsx
const useCustomHook = (callback) => {
  useEffect(() => {
    // 如果 callback 没有用 useCallback 包裹，这里会频繁执行
    callback();
  }, [callback]);
};
```

### ❌ 什么时候不使用

#### 1. 函数内部使用了大量依赖
```tsx
// ❌ 依赖太多，缓存意义不大
const handleClick = useCallback(() => {
  doSomething(a, b, c, d, e, f);
}, [a, b, c, d, e, f]);

// ✅ 直接定义函数
const handleClick = () => {
  doSomething(a, b, c, d, e, f);
};
```

#### 2. 子组件没有性能问题
```tsx
// ❌ 过度优化
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

// 子组件很简单，不需要优化
return <SimpleButton onClick={handleClick} />;
```

---

## React.memo

### 📌 作用
对组件进行**浅比较**，当 props 没有变化时跳过重新渲染。

### ✅ 什么时候使用

#### 1. 纯展示组件（频繁渲染但 props 不常变）
```tsx
const UserCard = React.memo(({ name, email }) => {
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
});
```

#### 2. 列表项组件
```tsx
const ListItem = React.memo(({ item }) => {
  return <div>{item.name}</div>;
});

const List = ({ items }) => {
  return items.map(item => <ListItem key={item.id} item={item} />);
};
```

#### 3. 复杂组件（渲染成本高）
```tsx
const ComplexChart = React.memo(({ data, config }) => {
  // 复杂的图表渲染逻辑
  return <Canvas data={data} config={config} />;
});
```

#### 4. 自定义比较函数
```tsx
const MyComponent = React.memo(
  ({ user }) => {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示 props 相等，不重新渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### ❌ 什么时候不使用

#### 1. Props 频繁变化的组件
```tsx
// ❌ props 每次都变，memo 没用
const Counter = React.memo(({ count }) => {
  return <div>{count}</div>;
});
```

#### 2. 组件本身很简单
```tsx
// ❌ 过度优化
const Label = React.memo(({ text }) => <span>{text}</span>);

// ✅ 直接定义
const Label = ({ text }) => <span>{text}</span>;
```

#### 3. Props 包含对象/数组/函数（未优化）
```tsx
// ❌ 无效优化：parent 每次渲染都创建新对象
const Child = React.memo(({ data }) => <div>{data.name}</div>);

const Parent = () => {
  // 每次都是新对象！
  return <Child data={{ name: 'John' }} />;
};

// ✅ 正确做法
const Parent = () => {
  const data = useMemo(() => ({ name: 'John' }), []);
  return <Child data={data} />;
};
```

---

## useTransition (React 18+)

### 📌 作用
将某些更新标记为**非紧急更新**（过渡更新），让 React 优先处理紧急更新，提升用户交互响应速度。

### ✅ 什么时候使用

#### 1. 大数据渲染不阻塞用户输入
```tsx
import { useState, useTransition } from 'react';

const SearchComponent = () => {
  const [input, setInput] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 立即更新输入框（紧急更新）
    setInput(e.target.value);
    
    // 延迟更新列表（非紧急更新）
    startTransition(() => {
      const filtered = largeDataSet.filter(item => 
        item.name.includes(e.target.value)
      );
      setList(filtered);
    });
  };

  return (
    <>
      <input value={input} onChange={handleChange} />
      {isPending && <div>加载中...</div>}
      <ul>
        {list.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </>
  );
};
```

#### 2. 路由切换优化
```tsx
const App = () => {
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  };

  return (
    <>
      <nav>
        <button onClick={() => navigateTo('home')}>首页</button>
        <button onClick={() => navigateTo('profile')}>个人中心</button>
      </nav>
      {isPending && <Spinner />}
      <PageComponent page={currentPage} />
    </>
  );
};
```

### ❌ 什么时候不使用
- 受控输入（如表单输入框的值）
- 需要立即反馈的操作（如按钮点击）

---

## useDeferredValue (React 18+)

### 📌 作用
延迟某个值的更新，让 React 优先渲染其他更重要的内容。

### ✅ 什么时候使用

#### 1. 搜索框联动大列表
```tsx
import { useState, useDeferredValue, useMemo } from 'react';

const SearchList = () => {
  const [query, setQuery] = useState('');
  // 延迟更新的查询值
  const deferredQuery = useDeferredValue(query);

  // 基于延迟值过滤数据
  const filteredList = useMemo(() => {
    return largeList.filter(item => 
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [deferredQuery]);

  return (
    <>
      {/* 输入框立即响应 */}
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
      />
      {/* 列表延迟更新 */}
      <ul>
        {filteredList.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  );
};
```

#### 2. 图表实时更新
```tsx
const ChartComponent = ({ realTimeData }) => {
  const deferredData = useDeferredValue(realTimeData);

  return (
    <div>
      <div>实时值: {realTimeData}</div>
      {/* 图表使用延迟值，避免频繁重绘 */}
      <ExpensiveChart data={deferredData} />
    </div>
  );
};
```

### 🆚 useTransition vs useDeferredValue

| 特性 | useTransition | useDeferredValue |
|------|--------------|------------------|
| 控制点 | 控制**状态更新** | 控制**值的使用** |
| 使用场景 | 你控制 setState | 接收 props 或第三方值 |
| 加载状态 | 提供 isPending | 不提供 |
| 示例 | `startTransition(() => setState(...))` | `const deferred = useDeferredValue(value)` |

---

## React.lazy 和 Suspense

### 📌 作用
动态导入组件，实现代码分割，减少初始加载体积。

### ✅ 基本用法

#### 1. 路由懒加载
```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载组件
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>加载中...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

#### 2. 条件加载重组件
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <>
      <button onClick={() => setShowHeavy(true)}>
        加载重组件
      </button>
      {showHeavy && (
        <Suspense fallback={<Skeleton />}>
          <HeavyComponent />
        </Suspense>
      )}
    </>
  );
};
```

#### 3. 预加载优化
```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 预加载函数
const preloadHeavyComponent = () => {
  import('./HeavyComponent');
};

const App = () => {
  return (
    <div>
      {/* 鼠标悬停时预加载 */}
      <button onMouseEnter={preloadHeavyComponent}>
        显示组件
      </button>
    </div>
  );
};
```

---

## useReducer 优化

### 📌 作用
当 state 逻辑复杂或涉及多个子值时，`useReducer` 比 `useState` 更优。

### ✅ 什么时候使用

#### 1. 复杂状态管理
```tsx
// ❌ useState：代码冗长
const [user, setUser] = useState({});
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchUser = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await api.getUser();
    setUser(data);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};

// ✅ useReducer：更清晰
const [state, dispatch] = useReducer(reducer, {
  user: null,
  loading: false,
  error: null
});

const fetchUser = async () => {
  dispatch({ type: 'FETCH_START' });
  try {
    const data = await api.getUser();
    dispatch({ type: 'FETCH_SUCCESS', payload: data });
  } catch (err) {
    dispatch({ type: 'FETCH_ERROR', payload: err });
  }
};
```

#### 2. 减少子组件重渲染
```tsx
// dispatch 引用稳定，不需要 useCallback
const [state, dispatch] = useReducer(reducer, initialState);

// 传递给子组件，不会导致重渲染
<Child onUpdate={dispatch} />
```

---

## useRef

### 📌 作用
存储**不触发重新渲染**的可变值，或直接访问 DOM 元素。

### ✅ 什么时候使用

#### 1. 存储不需要触发渲染的值
```tsx
const MyComponent = () => {
  // ❌ 使用 state：每次改变都会重新渲染
  const [count, setCount] = useState(0);

  // ✅ 使用 ref：改变不会触发渲染
  const countRef = useRef(0);

  const handleClick = () => {
    countRef.current++;
    console.log(countRef.current); // 不会触发重新渲染
  };

  return <button onClick={handleClick}>Click</button>;
};
```

#### 2. 访问 DOM 元素
```tsx
const InputComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>聚焦</button>
    </>
  );
};
```

#### 3. 存储定时器 ID
```tsx
const Timer = () => {
  const timerRef = useRef<NodeJS.Timeout>();

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      console.log('tick');
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => stopTimer(); // 清理
  }, []);

  return (
    <>
      <button onClick={startTimer}>开始</button>
      <button onClick={stopTimer}>停止</button>
    </>
  );
};
```

#### 4. 缓存前一次的值
```tsx
const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

// 使用
const Counter = ({ count }: { count: number }) => {
  const prevCount = usePrevious(count);

  return (
    <div>
      当前: {count}, 上一次: {prevCount}
    </div>
  );
};
```

#### 5. 避免闭包陷阱
```tsx
const Chat = () => {
  const [message, setMessage] = useState('');
  const messageRef = useRef(message);

  // 保持 ref 同步
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const sendMessage = useCallback(() => {
    // ✅ 使用 ref 获取最新值，避免闭包陷阱
    api.send(messageRef.current);
  }, []); // 依赖数组为空，但能获取最新值

  return (
    <>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={sendMessage}>发送</button>
    </>
  );
};
```

### ⚠️ 注意事项
- ref 值改变**不会触发重新渲染**
- 不要在渲染期间读写 `ref.current`（除了初始化）
- ref 适合存储：DOM 引用、定时器 ID、前一次的值、订阅对象

---

## forwardRef

### 📌 作用
允许组件将 ref 转发给子组件的 DOM 元素或组件实例。

### ✅ 基本用法

#### 1. 转发 ref 到 DOM 元素
```tsx
// ❌ 无法直接传递 ref 给函数组件
const Input = ({ value, onChange }) => {
  return <input value={value} onChange={onChange} />;
};

// ✅ 使用 forwardRef
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// 父组件使用
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <Input ref={inputRef} />
      <button onClick={focusInput}>聚焦输入框</button>
    </>
  );
};
```

#### 2. 封装第三方库组件
```tsx
import { Input as AntdInput } from 'antd';

// 转发 ref 给 Ant Design 组件
const CustomInput = forwardRef<InputRef, CustomInputProps>((props, ref) => {
  return (
    <div className="custom-input-wrapper">
      <AntdInput ref={ref} {...props} />
    </div>
  );
});
```

#### 3. 高阶组件中使用
```tsx
function withLogger<T extends object>(Component: ComponentType<T>) {
  const WithLogger = forwardRef<any, T>((props, ref) => {
    useEffect(() => {
      console.log('Component mounted');
    }, []);

    return <Component ref={ref} {...props} />;
  });

  return WithLogger;
}
```

### 🎯 使用场景
- 封装可复用的表单组件
- 封装可复用的按钮、输入框等基础组件
- 需要暴露 DOM 方法给父组件（focus、scroll 等）
- 高阶组件需要转发 ref

---

## useImperativeHandle

### 📌 作用
自定义通过 ref 暴露给父组件的实例值，而不是暴露整个 DOM 元素。

### ✅ 基本用法

#### 1. 自定义暴露的方法
```tsx
interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 只暴露特定的方法，而不是整个 video 元素
  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play();
    },
    pause: () => {
      videoRef.current?.pause();
    },
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    }
  }), []);

  return <video ref={videoRef} src={props.src} />;
});

// 父组件使用
const Parent = () => {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={() => playerRef.current?.play()}>播放</button>
      <button onClick={() => playerRef.current?.pause()}>暂停</button>
      <button onClick={() => playerRef.current?.seek(30)}>跳到30秒</button>
    </>
  );
};
```

#### 2. 表单组件暴露验证方法
```tsx
interface FormRef {
  validate: () => boolean;
  reset: () => void;
  getValues: () => Record<string, any>;
}

const Form = forwardRef<FormRef>((props, ref) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  useImperativeHandle(ref, () => ({
    validate: () => {
      const newErrors = validateForm(values);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    reset: () => {
      setValues({});
      setErrors({});
    },
    getValues: () => values
  }), [values]);

  return (
    <form>
      {/* 表单内容 */}
    </form>
  );
});

// 使用
const Parent = () => {
  const formRef = useRef<FormRef>(null);

  const handleSubmit = () => {
    if (formRef.current?.validate()) {
      const data = formRef.current.getValues();
      api.submit(data);
    }
  };

  return (
    <>
      <Form ref={formRef} />
      <button onClick={handleSubmit}>提交</button>
      <button onClick={() => formRef.current?.reset()}>重置</button>
    </>
  );
};
```

#### 3. 优化：添加依赖项
```tsx
const Input = forwardRef<InputRef, InputProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      setValue('');
      inputRef.current?.focus();
    },
    getValue: () => value,
    setValue: (newValue: string) => setValue(newValue)
  }), [value]); // ✅ 添加依赖项，避免闭包问题

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
});
```

### ⚠️ 注意事项
- 尽量少用，优先使用 props
- 主要用于命令式操作（focus、scroll、play/pause 等）
- 第三个参数是依赖数组，类似 useMemo

---

## useEffect vs useLayoutEffect

### 📌 区别

| 特性 | useEffect | useLayoutEffect |
|------|-----------|----------------|
| **执行时机** | 浏览器绘制**之后**异步执行 | 浏览器绘制**之前**同步执行 |
| **阻塞渲染** | 不阻塞 | 阻塞（类似 componentDidMount） |
| **使用场景** | 大多数副作用 | DOM 测量、同步更新 |
| **性能影响** | 更好 | 可能阻塞视觉更新 |

### ✅ useEffect - 默认选择

```tsx
const Component = () => {
  useEffect(() => {
    // 数据获取
    fetchData();
    
    // 订阅
    const subscription = subscribe();
    
    // 日志
    console.log('mounted');

    return () => {
      // 清理
      subscription.unsubscribe();
    };
  }, []);

  return <div>Content</div>;
};
```

### ✅ useLayoutEffect - 特定场景

#### 1. 测量 DOM 尺寸
```tsx
const Tooltip = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // ✅ 使用 useLayoutEffect 避免闪烁
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  }, []);

  return (
    <div 
      ref={ref} 
      style={{ position: 'absolute', left: position.x, top: position.y }}
    >
      Tooltip
    </div>
  );
};
```

#### 2. 同步 DOM 更新避免闪烁
```tsx
const AnimatedComponent = () => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // ✅ 在浏览器绘制前设置初始动画状态
    if (ref.current) {
      ref.current.style.opacity = '0';
      ref.current.style.transform = 'translateY(20px)';
      
      // 触发动画
      requestAnimationFrame(() => {
        ref.current!.style.transition = 'all 0.3s';
        ref.current!.style.opacity = '1';
        ref.current!.style.transform = 'translateY(0)';
      });
    }
  }, []);

  return <div ref={ref}>内容</div>;
};
```

#### 3. 滚动位置恢复
```tsx
const ScrollRestoration = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedPosition = useRef(0);

  useLayoutEffect(() => {
    // ✅ 在渲染前恢复滚动位置，避免跳动
    if (scrollRef.current) {
      scrollRef.current.scrollTop = savedPosition.current;
    }
  });

  const handleScroll = () => {
    savedPosition.current = scrollRef.current?.scrollTop || 0;
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll}>
      {children}
    </div>
  );
};
```

### 🎯 选择指南

```
需要副作用？
  ├─ 涉及 DOM 测量/修改且需要避免闪烁？
  │   └─ 是 → useLayoutEffect
  │
  └─ 其他所有情况 → useEffect
```

---

## useInsertionEffect (React 18+)

### 📌 作用
专为 **CSS-in-JS** 库设计，在 DOM 变更前注入样式，比 useLayoutEffect 更早执行。

### ✅ 使用场景

#### CSS-in-JS 库优化
```tsx
// styled-components、emotion 等库内部使用
const useCSS = (rule: string) => {
  useInsertionEffect(() => {
    // ✅ 在 DOM 变更前插入样式，避免闪烁
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [rule]);
};

const DynamicStyledComponent = () => {
  useCSS(`
    .dynamic-class {
      color: red;
      font-size: 16px;
    }
  `);

  return <div className="dynamic-class">动态样式</div>;
};
```

### ⚠️ 注意事项
- **仅用于 CSS-in-JS 库开发**
- 普通应用开发不需要使用
- 不能访问 ref（DOM 还未准备好）
- 执行顺序：`useInsertionEffect` → `useLayoutEffect` → `useEffect`

---

## useId (React 18+)

### 📌 作用
生成**唯一且稳定**的 ID，支持服务端渲染（SSR）。

### ✅ 使用场景

#### 1. 表单 label 和 input 关联
```tsx
const FormField = ({ label }: { label: string }) => {
  // ✅ 生成唯一 ID，SSR 安全
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </div>
  );
};

// 多个实例使用不会冲突
<>
  <FormField label="姓名" />  // id: :r1:
  <FormField label="邮箱" />  // id: :r2:
</>
```

#### 2. 无障碍属性
```tsx
const Tooltip = ({ children, content }: TooltipProps) => {
  const id = useId();

  return (
    <>
      <button aria-describedby={id}>
        {children}
      </button>
      <div id={id} role="tooltip">
        {content}
      </div>
    </>
  );
};
```

#### 3. 为多个元素生成相关 ID
```tsx
const FormGroup = () => {
  const id = useId();

  return (
    <div>
      <label htmlFor={id + '-name'}>姓名</label>
      <input id={id + '-name'} />
      
      <label htmlFor={id + '-email'}>邮箱</label>
      <input id={id + '-email'} />
    </div>
  );
};
```

### ❌ 不要用于

```tsx
// ❌ 不要用于列表 key
items.map(item => <Item key={useId()} {...item} />);

// ✅ 使用数据的唯一标识
items.map(item => <Item key={item.id} {...item} />);

// ❌ 不要用于生成随机数
const randomId = useId(); // 这不是随机的！
```

---

## useSyncExternalStore (React 18+)

### 📌 作用
订阅**外部数据源**（非 React state），支持并发渲染。

### ✅ 使用场景

#### 1. 订阅浏览器 API
```tsx
// 订阅在线状态
const useOnlineStatus = () => {
  return useSyncExternalStore(
    // subscribe: 订阅函数
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    // getSnapshot: 获取当前值
    () => navigator.onLine,
    // getServerSnapshot: SSR 时的初始值
    () => true
  );
};

// 使用
const App = () => {
  const isOnline = useOnlineStatus();

  return <div>网络状态: {isOnline ? '在线' : '离线'}</div>;
};
```

#### 2. 订阅窗口尺寸
```tsx
const useWindowWidth = () => {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,
    () => 0 // SSR
  );
};

const ResponsiveComponent = () => {
  const width = useWindowWidth();

  return (
    <div>
      {width < 768 ? '移动端' : '桌面端'}
    </div>
  );
};
```

#### 3. 订阅第三方状态管理库
```tsx
// Redux store
const useReduxStore = (selector: (state: State) => any) => {
  const store = useStore();

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
};

// 使用
const userName = useReduxStore(state => state.user.name);
```

#### 4. 订阅 localStorage
```tsx
const useLocalStorage = (key: string) => {
  const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  };

  const getSnapshot = () => {
    return localStorage.getItem(key);
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
};

// 使用
const App = () => {
  const token = useLocalStorage('auth_token');

  return <div>Token: {token}</div>;
};
```

### 🎯 为什么需要这个 Hook？
- React 18 的并发渲染可能导致外部 store 的值不一致
- `useSyncExternalStore` 确保在并发渲染中获取一致的快照
- 替代旧的 `useEffect` + `useState` 模式

---

## startTransition (React 18+)

### 📌 作用
独立的 transition API，不需要组件内的 state。

### ✅ 基本用法

#### 1. 与 useTransition 的区别
```tsx
// useTransition: 需要 isPending 状态
const [isPending, startTransition] = useTransition();

// startTransition: 独立函数，无状态
import { startTransition } from 'react';
startTransition(() => {
  // 非紧急更新
});
```

#### 2. 路由导航优化
```tsx
import { startTransition } from 'react';

const Navigation = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    // ✅ 将路由切换标记为非紧急
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <nav>
      <button onClick={() => handleNavigation('/home')}>首页</button>
      <button onClick={() => handleNavigation('/profile')}>个人中心</button>
    </nav>
  );
};
```

#### 3. 第三方库集成
```tsx
// 在第三方库中使用（不需要组件状态）
class MyStore {
  updateData(newData: Data) {
    startTransition(() => {
      this.notifyListeners(newData);
    });
  }
}
```

---

## flushSync

### 📌 作用
**强制同步更新** DOM，绕过 React 18 的自动批处理。

### ⚠️ 注意：谨慎使用
`flushSync` 会降低性能，仅在必要时使用。

### ✅ 使用场景

#### 1. 需要立即读取 DOM
```tsx
import { flushSync } from 'react-dom';

const Component = () => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    // ✅ 强制立即更新
    flushSync(() => {
      setCount(c => c + 1);
    });

    // 此时 DOM 已更新，可以立即读取
    console.log(ref.current?.textContent); // 最新的 count 值
  };

  return (
    <>
      <div ref={ref}>{count}</div>
      <button onClick={handleClick}>增加</button>
    </>
  );
};
```

#### 2. 第三方库需要同步 DOM
```tsx
const ChartComponent = () => {
  const [data, setData] = useState([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateChart = (newData: Data[]) => {
    // ✅ 确保 DOM 立即更新，然后初始化图表
    flushSync(() => {
      setData(newData);
    });

    // DOM 已更新，初始化图表
    if (chartRef.current) {
      thirdPartyChart.init(chartRef.current, data);
    }
  };

  return <div ref={chartRef} />;
};
```

#### 3. 打印功能
```tsx
const PrintableComponent = () => {
  const [expanded, setExpanded] = useState(false);

  const handlePrint = () => {
    // ✅ 展开所有内容后立即打印
    flushSync(() => {
      setExpanded(true);
    });

    // DOM 已更新，开始打印
    window.print();

    // 打印后恢复
    setExpanded(false);
  };

  return (
    <>
      <button onClick={handlePrint}>打印</button>
      <div>{expanded ? '完整内容' : '摘要'}</div>
    </>
  );
};
```

### ❌ 避免过度使用

```tsx
// ❌ 不必要的 flushSync
flushSync(() => {
  setState1(value1);
  setState2(value2);
});

// ✅ 利用自动批处理
setState1(value1);
setState2(value2); // 自动合并，只渲染一次
```

---

## useDebugValue

### 📌 作用
在 React DevTools 中为**自定义 Hook** 显示调试信息。

### ✅ 基本用法

#### 1. 简单调试值
```tsx
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ✅ 在 DevTools 中显示 "OnlineStatus: 在线" 或 "OnlineStatus: 离线"
  useDebugValue(isOnline ? '在线' : '离线');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

#### 2. 格式化复杂值
```tsx
const useUser = (userId: string) => {
  const [user, setUser] = useState(null);

  // ✅ 格式化显示用户信息
  useDebugValue(user, u => 
    u ? `${u.name} (${u.email})` : '加载中...'
  );

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return user;
};
```

#### 3. 性能优化：延迟格式化
```tsx
const useExpensiveData = () => {
  const data = useSomeExpensiveHook();

  // ✅ 只有在 DevTools 打开时才执行格式化
  useDebugValue(data, data => {
    // 这个函数只在检查时调用
    return expensiveFormat(data);
  });

  return data;
};
```

#### 4. 显示多个调试信息
```tsx
const useForm = () => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 显示表单状态摘要
  useDebugValue({
    fields: Object.keys(values).length,
    errors: Object.keys(errors).length,
    touched: Object.keys(touched).length
  });

  return { values, errors, touched, setValues, setErrors, setTouched };
};
```

#### 5. 实战示例：自定义 Hook 库
```tsx
// useLocalStorage Hook
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  // 显示 key 和当前值
  useDebugValue({ key, value: storedValue });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};

// useFetch Hook
const useFetch = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 显示请求状态
  useDebugValue(
    loading ? '加载中...' : error ? `错误: ${error.message}` : '成功',
    label => `[${url}] ${label}`
  );

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
};
```

### ⚠️ 注意事项
- **仅用于自定义 Hook**，不在组件中使用
- 不影响应用性能（DevTools 关闭时不执行）
- 主要用于开发调试，不是生产功能

### 🎯 何时使用
- 开发可复用的自定义 Hook 库
- Hook 内部状态复杂，需要调试信息
- 团队协作，方便其他开发者理解 Hook 状态

---

## Context 优化

### 📌 问题
Context 更新会导致所有消费者重渲染，即使它们只用了部分数据。

### ✅ 优化策略

#### 1. 拆分 Context
```tsx
// ❌ 单一 Context：user 更新导致所有消费者重渲染
const AppContext = createContext();

// ✅ 拆分 Context：独立更新
const UserContext = createContext();
const ThemeContext = createContext();
const SettingsContext = createContext();

const App = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <App />
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
};
```

#### 2. 使用 useMemo 包裹 Context value
```tsx
const MyContext = createContext();

const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // ✅ 缓存 value，避免不必要的重渲染
  const value = useMemo(() => ({
    state,
    setState
  }), [state]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};
```

#### 3. 分离数据和更新函数
```tsx
const StateContext = createContext();
const DispatchContext = createContext();

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      {/* dispatch 永远不变，消费它的组件不会重渲染 */}
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

// 使用
const useAppState = () => useContext(StateContext);
const useAppDispatch = () => useContext(DispatchContext);
```

#### 4. 使用选择器模式
```tsx
// 自定义 Hook 只订阅需要的数据
const useUser = () => {
  const { user } = useContext(AppContext);
  return user;
};

const useTheme = () => {
  const { theme } = useContext(AppContext);
  return theme;
};
```

---

## 虚拟化列表

### 📌 作用
只渲染可见区域的列表项，大幅提升长列表性能。

### ✅ 使用 react-window

```tsx
import { FixedSizeList } from 'react-window';

const VirtualList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}      // 容器高度
      itemCount={items.length}
      itemSize={50}     // 每项高度
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};

// 1万条数据也流畅渲染！
<VirtualList items={tenThousandItems} />
```

### ✅ 使用 react-virtualized

```tsx
import { List } from 'react-virtualized';

const VirtualizedList = ({ items }) => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      {items[index].name}
    </div>
  );

  return (
    <List
      width={800}
      height={600}
      rowCount={items.length}
      rowHeight={50}
      rowRenderer={rowRenderer}
    />
  );
};
```

---

## 防抖和节流

### 📌 作用
限制函数执行频率，优化高频触发的事件（搜索、滚动、resize）。

### ✅ 防抖（Debounce）

```tsx
import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

const SearchInput = () => {
  const [results, setResults] = useState([]);

  // ✅ 使用 useCallback 保持引用稳定
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      const data = await api.search(query);
      setResults(data);
    }, 300),
    []
  );

  return (
    <input 
      onChange={(e) => debouncedSearch(e.target.value)} 
    />
  );
};
```

### ✅ 自定义防抖 Hook

```tsx
import { useEffect, useState } from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// 使用
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
};
```

### ✅ 节流（Throttle）

```tsx
import { throttle } from 'lodash';

const ScrollComponent = () => {
  const handleScroll = useCallback(
    throttle(() => {
      console.log('滚动事件触发');
      // 处理滚动逻辑
    }, 200),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <div>内容</div>;
};
```

---

## 代码分割策略

### 📌 策略

#### 1. 路由级别分割
```tsx
// 按路由拆分打包
const Home = lazy(() => import('./routes/Home'));
const About = lazy(() => import('./routes/About'));
const Dashboard = lazy(() => import('./routes/Dashboard'));
```

#### 2. 组件级别分割
```tsx
// 分割大型第三方库
const Chart = lazy(() => import('./components/Chart'));
const Editor = lazy(() => import('./components/RichEditor'));
```

#### 3. 基于用户角色分割
```tsx
const AdminPanel = lazy(() => import('./admin/AdminPanel'));

const App = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<Loading />}>
      {user.isAdmin && <AdminPanel />}
    </Suspense>
  );
};
```

#### 4. 动态导入优化
```tsx
// ✅ 命名导入（预加载优化）
const HeavyChart = lazy(() => 
  import(/* webpackChunkName: "heavy-chart" */ './HeavyChart')
);

// ✅ 按需加载多个组件
const { Chart, Table } = await import('./components');
```

---

## 其他优化技巧

### 1. 合理使用 key

```tsx
// ❌ 使用 index 作为 key（列表顺序变化会有问题）
{items.map((item, index) => <Item key={index} {...item} />)}

// ✅ 使用稳定的唯一 ID
{items.map(item => <Item key={item.id} {...item} />)}

// ✅ 组合 key（避免重复）
{items.map(item => <Item key={`${item.type}-${item.id}`} {...item} />)}
```

### 2. 避免内联对象/数组/函数

```tsx
// ❌ 每次渲染创建新对象
<Component style={{ margin: 10 }} />
<Component data={[1, 2, 3]} />
<Component onClick={() => console.log('click')} />

// ✅ 提取到外部或使用 useMemo
const style = { margin: 10 };
const data = [1, 2, 3];
const handleClick = useCallback(() => console.log('click'), []);

<Component style={style} data={data} onClick={handleClick} />
```

### 3. 图片优化

```tsx
// 1. 懒加载图片
<img loading="lazy" src={imageUrl} alt="description" />

// 2. 使用 WebP 格式
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="description" />
</picture>

// 3. 响应式图片
<img 
  srcSet="small.jpg 300w, medium.jpg 768w, large.jpg 1200w"
  sizes="(max-width: 300px) 300px, (max-width: 768px) 768px, 1200px"
  src="medium.jpg" 
  alt="description"
/>
```

### 4. 使用 CSS 而非 JS

```tsx
// ❌ 用 JS 控制样式
const [isOpen, setIsOpen] = useState(false);
<div style={{ display: isOpen ? 'block' : 'none' }}>内容</div>

// ✅ 用 CSS 类
<div className={isOpen ? 'open' : 'closed'}>内容</div>
```

### 5. 批量更新状态

```tsx
// ❌ 多次 setState 触发多次渲染
setName('John');
setAge(25);
setEmail('john@example.com');

// ✅ 使用对象合并一次更新
setState(prev => ({
  ...prev,
  name: 'John',
  age: 25,
  email: 'john@example.com'
}));

// ✅ React 18 自动批处理
setTimeout(() => {
  setName('John');
  setAge(25); // 自动批处理，只触发一次渲染
}, 1000);
```

### 6. Web Workers 处理计算

```tsx
// worker.js
self.onmessage = (e) => {
  const result = heavyCalculation(e.data);
  self.postMessage(result);
};

// Component.tsx
const useWorker = () => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const worker = new Worker('worker.js');
    
    worker.onmessage = (e) => setResult(e.data);
    worker.postMessage(data);

    return () => worker.terminate();
  }, []);

  return result;
};
```

### 7. 使用 Fragment 避免额外 DOM

```tsx
// ❌ 额外的 div
return (
  <div>
    <Header />
    <Content />
  </div>
);

// ✅ 使用 Fragment
return (
  <>
    <Header />
    <Content />
  </>
);
```

---

## 性能优化最佳实践

### 1. 组合使用三者
```tsx
const Parent = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // useMemo 缓存对象
  const user = useMemo(() => ({
    name,
    age: 25
  }), [name]);

  // useCallback 缓存函数
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  // React.memo 包裹子组件
  return <MemoizedChild user={user} onClick={handleClick} />;
};

const MemoizedChild = React.memo(({ user, onClick }) => {
  return (
    <div>
      <p>{user.name}</p>
      <button onClick={onClick}>Increment</button>
    </div>
  );
});
```

### 2. 依赖项要完整且精确
```tsx
// ❌ 依赖项不完整
const result = useMemo(() => {
  return data.filter(item => item.category === category);
}, [data]); // 缺少 category

// ✅ 完整的依赖项
const result = useMemo(() => {
  return data.filter(item => item.category === category);
}, [data, category]);
```

### 3. 避免在依赖项中使用对象属性
```tsx
// ❌ 可能导致不必要的重新计算
const result = useMemo(() => {
  return calculate(user.name);
}, [user]); // user 对象引用变化就会重新计算

// ✅ 只依赖需要的属性
const result = useMemo(() => {
  return calculate(user.name);
}, [user.name]);
```

---

## 常见误区

### ❌ 误区 1：所有组件都用 React.memo
```tsx
// 过度优化反而降低性能
const App = React.memo(() => {
  const SimpleComponent = React.memo(() => <div>Hello</div>);
  const AnotherComponent = React.memo(() => <span>World</span>);
  return (
    <>
      <SimpleComponent />
      <AnotherComponent />
    </>
  );
});
```

### ❌ 误区 2：所有函数都用 useCallback
```tsx
// 不必要的优化
const Component = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // 这是个简单的内部按钮，不需要优化
  return <button onClick={handleClick}>Click</button>;
};
```

### ❌ 误区 3：忽略优化成本
```tsx
// useMemo 和 useCallback 本身也有成本
// 简单计算直接写比用 useMemo 更快
const total = useMemo(() => a + b, [a, b]); // ❌ 过度优化
const total = a + b; // ✅ 更简单
```

---

## 优化决策树

```
开始
  ├─ 是否是简单计算/值？
  │   ├─ 是 → 不需要优化
  │   └─ 否 → 继续
  │
  ├─ 是函数还是值？
  │   ├─ 函数 → 考虑 useCallback
  │   │   ├─ 传给 memo 组件？→ 使用 useCallback
  │   │   ├─ 作为依赖项？→ 使用 useCallback
  │   │   └─ 其他 → 不需要
  │   │
  │   └─ 值 → 考虑 useMemo
  │       ├─ 计算昂贵？→ 使用 useMemo
  │       ├─ 对象/数组传给 memo 组件？→ 使用 useMemo
  │       ├─ 作为依赖项？→ 使用 useMemo
  │       └─ 其他 → 不需要
  │
  └─ 是否是组件？
      ├─ 是 → 考虑 React.memo
      │   ├─ 渲染成本高？→ 使用 React.memo
      │   ├─ props 不常变？→ 使用 React.memo
      │   └─ 其他 → 不需要
      └─ 否 → 结束
```

---

## 性能监测工具

### React DevTools Profiler
```tsx
// 使用 Profiler 组件测量性能
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms`);
}}>
  <MyComponent />
</Profiler>
```

### Chrome DevTools Performance
1. 打开 Chrome DevTools
2. 切换到 Performance 标签
3. 录制交互过程
4. 分析火焰图，找出性能瓶颈

---

## 总结

### 核心 Hooks 和 API

#### 性能优化 Hooks

| Hook/API | 用途 | 何时使用 | 何时不用 |
|---------|------|---------|---------|
| **useMemo** | 缓存计算结果 | 复杂计算、对象/数组作为依赖项 | 简单计算、原始值 |
| **useCallback** | 缓存函数引用 | 传给 memo 组件、作为依赖项 | 简单事件处理、不传给子组件 |
| **React.memo** | 缓存组件渲染 | 纯组件、渲染成本高、props 不常变 | props 频繁变化、组件简单 |
| **useTransition** | 标记非紧急更新 | 大列表过滤、路由切换 | 受控输入、需要立即反馈 |
| **useDeferredValue** | 延迟值更新 | 搜索联动、图表实时更新 | 立即响应的交互 |
| **useReducer** | 复杂状态管理 | 多个相关状态、复杂状态逻辑 | 简单的单一状态 |
| **React.lazy** | 动态导入组件 | 路由、大型组件 | 首屏必需组件 |

#### Ref 相关 API

| Hook/API | 用途 | 主要场景 |
|---------|------|---------|
| **useRef** | 存储不触发渲染的值 | DOM 引用、定时器 ID、前值缓存、避免闭包陷阱 |
| **forwardRef** | 转发 ref 给子组件 | 封装可复用组件、暴露 DOM 方法给父组件 |
| **useImperativeHandle** | 自定义暴露的实例值 | 表单验证、播放器控制、命令式 API |

#### 副作用 Hooks

| Hook/API | 执行时机 | 使用场景 |
|---------|---------|---------|
| **useEffect** | 浏览器绘制后（异步） | 数据获取、订阅、日志（默认选择） |
| **useLayoutEffect** | 浏览器绘制前（同步） | DOM 测量、避免闪烁、滚动位置恢复 |
| **useInsertionEffect** | DOM 变更前（最早） | CSS-in-JS 库开发（普通开发不用） |

#### React 18 新增 API

| Hook/API | 用途 | 主要场景 |
|---------|------|---------|
| **useId** | 生成唯一 ID | 表单 label/input 关联、无障碍属性（SSR 安全） |
| **useSyncExternalStore** | 订阅外部数据源 | 浏览器 API、第三方状态库、localStorage |
| **startTransition** | 独立的 transition API | 路由导航、第三方库集成 |
| **flushSync** | 强制同步更新 | 立即读取 DOM、第三方库集成、打印功能 |

#### 调试工具

| Hook/API | 用途 | 使用场景 |
|---------|------|---------|
| **useDebugValue** | DevTools 中显示调试信息 | 自定义 Hook 开发、复杂 Hook 状态调试 |

### 优化技术对照表

| 技术 | 解决问题 | 性能提升 | 实现难度 |
|------|---------|---------|---------|
| **虚拟化列表** | 长列表渲染 | ⭐⭐⭐⭐⭐ | 中等 |
| **代码分割** | 初始加载慢 | ⭐⭐⭐⭐⭐ | 简单 |
| **防抖/节流** | 高频事件 | ⭐⭐⭐⭐ | 简单 |
| **Context 拆分** | 全局状态更新 | ⭐⭐⭐⭐ | 中等 |
| **Web Workers** | CPU 密集计算 | ⭐⭐⭐⭐⭐ | 困难 |
| **图片懒加载** | 图片资源多 | ⭐⭐⭐ | 简单 |
| **合理使用 key** | 列表渲染 | ⭐⭐⭐ | 简单 |

### 黄金法则
> **先测量，后优化。不要过早优化！**

1. 首先写出可读性好的代码
2. 使用 Profiler 找出性能瓶颈
3. 针对性地使用优化手段
4. 验证优化效果

---

## 实战示例

### 示例 1：商品列表优化
```tsx
const ProductList = ({ products, category }) => {
  // useMemo：过滤计算
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.category === category);
  }, [products, category]);

  // useCallback：传给子组件的函数
  const handleAddToCart = useCallback((productId) => {
    addToCart(productId);
  }, []);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};

// React.memo：列表项组件
const ProductCard = React.memo(({ product, onAddToCart }) => {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      <button onClick={() => onAddToCart(product.id)}>
        加入购物车
      </button>
    </div>
  );
});
```

### 示例 2：表单优化
```tsx
const FormComponent = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });

  // useCallback：防止子组件重复渲染
  const handleNameChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleEmailChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, email: e.target.value }));
  }, []);

  // useMemo：验证逻辑
  const isValid = useMemo(() => {
    return formData.name.length > 0 && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  }, [formData.name, formData.email]);

  return (
    <form>
      <Input value={formData.name} onChange={handleNameChange} />
      <Input value={formData.email} onChange={handleEmailChange} />
      <button disabled={!isValid}>提交</button>
    </form>
  );
};

const Input = React.memo(({ value, onChange }) => {
  console.log('Input rendered');
  return <input value={value} onChange={onChange} />;
});
```

---

## 性能优化检查清单

### 🔍 发现性能问题时的诊断流程

```
1. 使用 React DevTools Profiler 定位慢组件
   ↓
2. 检查组件是否频繁重渲染
   ↓
3. 分析渲染慢的原因：
   ├─ 计算复杂？ → useMemo
   ├─ 函数作为 props？ → useCallback
   ├─ 子组件不需要更新？ → React.memo
   ├─ 长列表？ → 虚拟化
   ├─ 大数据输入？ → useTransition/useDeferredValue
   ├─ Context 导致？ → 拆分 Context
   ├─ 组件太大？ → React.lazy 拆分
   └─ 高频事件？ → 防抖/节流
```

### ✅ 项目优化检查表

#### 基础优化（必做）
- [ ] 使用 `key` 属性，且不用 `index` 作为 key
- [ ] 避免在 JSX 中内联对象、数组、函数
- [ ] 使用 `React.lazy` 和 `Suspense` 进行路由级代码分割
- [ ] 图片添加 `loading="lazy"` 属性
- [ ] 使用 `React.Fragment` 避免多余 DOM 节点

#### 中级优化（按需）
- [ ] 使用 `React.memo` 包裹纯组件和列表项
- [ ] 使用 `useMemo` 缓存复杂计算和对象/数组
- [ ] 使用 `useCallback` 缓存传给子组件的函数
- [ ] 拆分 Context，避免不必要的重渲染
- [ ] 对搜索、滚动等高频事件使用防抖/节流

#### 高级优化（性能瓶颈时）
- [ ] 使用虚拟化列表处理超长列表（1000+ 项）
- [ ] 使用 `useTransition` 优化大数据更新
- [ ] 使用 `useDeferredValue` 延迟非关键更新
- [ ] 使用 Web Workers 处理 CPU 密集计算
- [ ] 使用 `useReducer` 替代复杂的 `useState`
- [ ] 按需加载第三方库（Chart、Editor 等）

#### React 18 特性（推荐）
- [ ] 使用自动批处理减少渲染次数
- [ ] 使用 `useTransition` 标记非紧急更新
- [ ] 使用 `useDeferredValue` 优化输入响应
- [ ] 使用并发渲染特性提升用户体验

### 📊 性能指标参考

| 场景 | 目标 | 优化手段 |
|------|------|---------|
| **首次内容渲染 (FCP)** | < 1.8s | 代码分割、懒加载 |
| **最大内容渲染 (LCP)** | < 2.5s | 图片优化、预加载 |
| **首次输入延迟 (FID)** | < 100ms | useTransition、Web Workers |
| **累积布局偏移 (CLS)** | < 0.1 | 固定尺寸、避免动态插入 |
| **列表渲染** | < 50ms | 虚拟化、React.memo |
| **搜索响应** | < 200ms | 防抖、useDeferredValue |

### 🎯 快速优化建议

#### 场景 1：输入框联动大列表
```tsx
// 组合使用 useDeferredValue + useMemo + 虚拟化
const deferredQuery = useDeferredValue(query);
const filtered = useMemo(() => filter(data, deferredQuery), [data, deferredQuery]);
return <VirtualList items={filtered} />;
```

#### 场景 2：复杂表单
```tsx
// 使用 useReducer + React.memo 拆分子组件
const [state, dispatch] = useReducer(formReducer, initialState);
return <MemoizedFormFields state={state} dispatch={dispatch} />;
```

#### 场景 3：实时数据看板
```tsx
// 使用 useDeferredValue 降低图表更新频率
const deferredData = useDeferredValue(realTimeData);
return <ExpensiveChart data={deferredData} />;
```

#### 场景 4：长列表
```tsx
// 虚拟化 + React.memo
const MemoizedRow = React.memo(Row);
<FixedSizeList itemSize={50}>{MemoizedRow}</FixedSizeList>
```

---

## 推荐工具和库

### 性能分析
- **React DevTools Profiler** - 组件渲染性能分析
- **Chrome DevTools Performance** - 整体性能分析
- **Lighthouse** - 网站性能评分
- **Web Vitals** - 核心性能指标监控

### 优化库
- **react-window** / **react-virtualized** - 虚拟化列表
- **lodash** - 防抖节流工具函数
- **use-debounce** - React 防抖 Hook
- **immer** - 不可变数据优化

### 打包优化
- **webpack-bundle-analyzer** - 分析打包体积
- **compression-webpack-plugin** - Gzip 压缩
- **terser-webpack-plugin** - JS 压缩

---

**最后的建议**：性能优化是一门艺术，需要在代码可读性和运行效率之间找到平衡。记住：**可维护的代码 > 过度优化的代码**。

**优化三原则**：
1. 先测量，找到真正的瓶颈
2. 针对性优化，不要过早优化
3. 验证效果，确保优化有效

