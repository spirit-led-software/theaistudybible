import { ModelInfo, allModels } from '@theaistudybible/ai/models';
import { useChatStore } from '../providers/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export const ModelSelector = () => {
  const [chatStore, setChatStore] = useChatStore();

  return (
    <Select<ModelInfo>
      value={allModels.find((model) => `${model.provider}:${model.id}` === chatStore.modelId)}
      onChange={(value) => setChatStore('modelId', `${value.provider}:${value.id}`)}
      options={allModels}
      optionValue={(model) => `${model.provider}:${model.id}`}
      optionTextValue="name"
      optionDisabled={(model) => `${model.provider}:${model.id}` === chatStore.modelId}
      itemComponent={(props) => (
        <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>
      )}
    >
      <SelectTrigger class="max-w-full flex-1">
        <SelectValue<ModelInfo>>{(state) => state.selectedOption().name}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
};
