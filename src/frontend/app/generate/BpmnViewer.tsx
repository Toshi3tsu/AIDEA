import React, { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import useFlowStore from '../store/flowStore';

interface BpmnViewerProps {
  xml: string;
}

const BpmnViewer: React.FC<BpmnViewerProps> = ({ xml }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModeler | null>(null);
  const { setGeneratedFlow } = useFlowStore();

  useEffect(() => {
    if (containerRef.current) {
      // Modelerのインスタンスを初期化
      modelerRef.current = new BpmnModeler({
        container: containerRef.current,
      });

      // XMLをインポート
      modelerRef.current.importXML(xml)
        .then(() => {
          // ビューポートを調整
          modelerRef.current?.get('canvas').zoom('fit-viewport');
        })
        .catch((err: any) => {
          console.error('BPMN Modelerのインポートエラー:', err);
        });

      // 変更があった場合にXMLをエクスポートしてストアに保存
      const eventBus = modelerRef.current.get('eventBus');
      eventBus.on('commandStack.changed', async () => {
        try {
          const { xml } = await modelerRef.current!.saveXML({ format: true });
          setGeneratedFlow(xml);
        } catch (err) {
          console.error('BPMN XMLのエクスポートエラー:', err);
        }
      });
    }

    // クリーンアップ
    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [xml, setGeneratedFlow]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '400px', border: '1px solid #ccc' }} />
  );
};

export default BpmnViewer;
