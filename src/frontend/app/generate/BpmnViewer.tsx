// src/frontend/app/components/BpmnViewer.tsx
import React, { useEffect, useRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import useFlowStore from '../store/flowStore';
import axios from 'axios';

interface BpmnViewerProps {
  xml: string;
  projectId: string;
}

const BpmnViewer: React.FC<BpmnViewerProps> = ({ xml, projectId }) => {
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
          const { xml: updatedXml } = await modelerRef.current!.saveXML({ format: true });
          setGeneratedFlow(updatedXml);
          // バックエンドにフローを保存
          await axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/flow`, {
            bpmn_xml: updatedXml,
          });
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
  }, [xml, setGeneratedFlow, projectId]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '400px', border: '1px solid #ccc' }} />
  );
};

export default BpmnViewer;
