/**
 * 新規チャット用：角丸のシート枠＋ペン（ストロークのみ・塗りなし）
 * 一般的な「compose / square-pen」系アイコンのシルエットに合わせています。
 */
export function NewChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* 開いた角丸シート（右上がペンで途切れる構成） */}
      <path
        d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.375 2.625a1 1 0 0 1 3 3l-9.379 9.379a2 2 0 0 1-.835.506l-2.843.852a.5.5 0 0 1-.625-.625l.852-2.843a2 2 0 0 1 .506-.835z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
