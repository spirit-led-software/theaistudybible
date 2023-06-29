import { TbCross } from "react-icons/tb";

type MessageProps = {
  text: string;
  sender: string;
};

export function Message({ text, sender }: MessageProps) {
  return (
    <div className="inline-flex w-full items-center px-2 py-4 bg-white border border-t-slate-300">
      <div className="p-2 rounded-full bg-slate-700 text-white">
        {sender === "user" ? (
          <div className="text-sm">You</div>
        ) : (
          <TbCross className="text-lg" />
        )}
      </div>
      <div className="pl-5 pr-3 break-words whitespace-pre-wrap">{text}</div>
    </div>
  );
}
