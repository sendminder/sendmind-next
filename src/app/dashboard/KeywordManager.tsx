"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

export default function KeywordManager() {
  const { data: session } = useSession();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const userId = session?.user?.email;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("user_keywords")
      .select("keyword")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (!error && data) {
          setKeywords(data.map((row) => row.keyword));
        }
        setLoading(false);
      });
  }, [userId]);

  const addKeyword = async () => {
    if (!input.trim() || !userId) return;
    setLoading(true);
    const { error } = await supabase.from("user_keywords").insert({
      user_id: userId,
      keyword: input.trim(),
    });
    if (!error) setKeywords((prev) => [...prev, input.trim()]);
    setInput("");
    setLoading(false);
  };

  const removeKeyword = async (keyword: string) => {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase
      .from("user_keywords")
      .delete()
      .eq("user_id", userId)
      .eq("keyword", keyword);
    if (!error) setKeywords((prev) => prev.filter((k) => k !== keyword));
    setLoading(false);
  };

  if (!session) return <div>로그인 후 키워드를 관리할 수 있습니다.</div>;

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">관심 키워드</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 rounded flex-1"
          placeholder="키워드 입력"
          disabled={loading}
        />
        <button
          onClick={addKeyword}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading || !input.trim()}
        >
          추가
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <li key={keyword} className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded flex items-center">
            <span>{keyword}</span>
            <button
              onClick={() => removeKeyword(keyword)}
              className="ml-2 text-red-500 hover:underline"
              disabled={loading}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 