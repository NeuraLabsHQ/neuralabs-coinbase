import { BasicInfoSection } from './sections/BasicInfoSection';
import { SchemaSection } from './sections/SchemaSection';
import { ParametersSection } from './sections/ParametersSection';
import { MetadataSection } from './sections/MetadataSection';
import { HyperparametersSection } from './sections/HyperparametersSection';
import { useElementStore } from '@/stores/elementStore';

export function ElementForm() {
  const { element } = useElementStore();
  const isFlowControl = ['case', 'flow_select'].includes(element.type);
  const isCustom = element.type === 'custom';
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BasicInfoSection />
      <SchemaSection type="input" />
      <SchemaSection type="output" />
      <ParametersSection />
      <MetadataSection />
      <HyperparametersSection />
    </div>
  );
}