'use client'
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import Recorder from '../recorder';
import styles from '../audioInputBtn.module.css'
import { throttle } from "lodash";

const getConfig = (key: string) => {
    type ConfigType = {
        [key: string]: string | number;
      };
  const IATConfig:ConfigType = {
    appId: '01c96af9',
    apiKey: '56254404aa18f506fdbe33bd51ca49e2',
    apiSecret: 'NDhmYjY4NjQxNGYzZjUwYWJkYjQyOGRk',
    accent: 'mandarin',
    language: 'zh_cn',
    pd: '',
    rlang: '',
    ptt: 0,
    nunum: 0,
    vad_eos: 3000,
  };
  return IATConfig?.[key] || null;
};

  const AudioInputBtn = () => {
    const [msg, setMsg] = useState('');
    const [isAudioInput, setIsAudioInput ] = useState(false);
    const [recorder, setRecorder] = useState(null as any);
    const [processing, setProcessing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [isAudioAvailable, setIsAudioAvailable] = useState(false);
    const [resultCache, setResultCache] = useState({} as any);
    const [responding, setResponding] = useState(false);
    const resCacheRef = useRef(resultCache);
  
    const menuPop = (e:React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
        // 忽略菜单
        e.preventDefault();
    };
  
 
  
    const reset = () => {
      setResultCache({});
      setResponding(false);
      setTimeout(() => {
        setMsg('');
      }, 500);
    };
  
    const start = throttle( (e: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element> ) => {
        console.log('1')
        e.cancelable && e.preventDefault();
        if (recording || (e && e.type === 'mousedown' && 'button' in e &&e.button !== 0)) return;
        if (!isAudioAvailable) {
          if (
            !getConfig('appId') ||
            !getConfig('apiKey') ||
            !getConfig('apiSecret')
          ) {
              setMsg('该功能暂不支持')
            return;
          }
          
          setMsg('无法正常录音，请检查麦克风权限后重试')
          return;
        }
        reset();
        setMsg('开始说话吧')
        setRecording(true);
        recorder &&recorder?.start();
        // Emit event if needed
      }, 500);
  
    const stop = (e?: React.MouseEvent<Element, MouseEvent> | React.TouchEvent<Element>) => {
      e && e.cancelable && e.preventDefault();
      if (e && e.type === 'mousedown' && 'button' in e && e.button !== 0) return;
      setRecording(false);
      recorder && recorder?.stop();
      setProcessing(true);
    };
  
    const appendResult = (text: any, sn: any) => {
      const tmp = resCacheRef.current;
      setResultCache({ ...tmp, [sn]: { text } });
    };
  
    const replaceResult = (text: any, sn: any, start: any, end: any) => {
      const resultCacheCopy = resCacheRef.current;
      for (let i = start; i <= end; i++) {
        if (resultCacheCopy[i]) {
          resultCacheCopy[i].discarded = true;
        }
      }
      setResultCache({ ...resultCacheCopy, [sn]: { text } });
    };
  
    const getResult = () =>
      Object.values(resCacheRef.current)
        .filter((item: any) => !item?.discarded)
        .map((item: any) => item?.text)
        .join('');
  
    const setResults = (data: any) => {
      setResponding(true);
      let str = '';
      const ws = data.ws;
      for (let i = 0; i < ws.length; i++) {
        str = str + ws[i].cw[0].w;
      }
      const pgs = data.pgs;
      const sn = data.sn;
      const ls = data.ls;
      if (pgs) {
        if (pgs === 'apd') {
          appendResult(str, sn);
        } else {
          const [s, e] = data.rg;
          replaceResult(str, sn, s, e);
        }
      } else {
        appendResult(str, sn);
      }
  
      if (ls) {
        // reset();
        // 最后一片响应结果，结束
        setResponding(false);
      }
    };
  
    useEffect(() => {
      const result = getResult();
      setMsg(result);
    }, [resultCache]);
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const recorder = new Recorder({
          onClose: () => {
            stop();
            setProcessing(false);
          },
          onError: () => {
            stop();
            reset();
            setProcessing(false);
            setMsg('抱歉，出了点错请重试')
          },
          onMessage: (e: any) => {
            const jsonData = JSON.parse(e.data);
            if (jsonData.data && jsonData.data.result) {
              setResults(jsonData.data.result);
            }
          },
          onStart: () => {},
          appId: getConfig('appId'),
          apiKey: getConfig('apiKey'),
          apiSecret: getConfig('apiSecret'),
          accent: getConfig('accent'),
          language: getConfig('language'),
          pd: getConfig('pd'),
          rlang: getConfig('rlang'),
          ptt: getConfig('ptt'),
          nunum: getConfig('nunum'),
          vad_eos: getConfig('vad_eos'),
        });
        console.log(recorder)
        const freezKeys = [
          'appId',
          'apiSecret',
          'apiKey',
          'accent',
          'language',
          'pd',
          'rlang',
          'ptt',
          'nunum',
          'vad_eos',
          'config',
        ];
  
        freezKeys.forEach(key => {
          Object.defineProperty(recorder, key, {
            configurable: false,
          });
        });
  
        setRecorder(recorder as any);
        setIsAudioAvailable(
          recorder?.isAudioAvailable &&
            getConfig('appId') &&
            getConfig('apiKey') &&
            getConfig('apiSecret') ? true: false
        );
      }
  
      return () => {
        if (recorder) {
          recorder.stop();
        }
        setRecorder(null);
      };
    }, []);
  
  
    useEffect(() => {
      resCacheRef.current = resultCache;
    }, [resultCache]);
  
    useEffect(() => {
      setIsAudioInput(recording || processing || responding);
    }, [recording, processing, responding]);
  
    return (
      <>
        <div
          className={styles.container}
        >
            <div
            className={styles.result} 
            >
               输出：{msg}
            </div>
            <div className={styles.option}>

           
            <div 
            className={styles.recorder}
            onContextMenu={e =>menuPop(e)}
            onMouseDown={ e=>start(e) }
            onMouseUp={e=> {if(recording) stop(e)}}
            onTouchStart={e=>start(e)}
            onTouchEnd={e=> {if(recording) stop(e)}}
            >
                点我
            </div>
            <div className={styles.tips}>（按压说话，松开结束）</div>
            </div>
        </div>
  
      </>
    );
  };
  
  export default AudioInputBtn;
  