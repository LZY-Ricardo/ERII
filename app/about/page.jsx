import Header from "@/src/components/Header";
import SecretTrigger from "@/src/components/SecretTrigger";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <Header />

        <section className="mt-10 rounded-3xl border border-wafu-sumi/10 bg-wafu-paper/75 p-8 shadow-sm backdrop-blur">
          <h1 className="font-serif text-4xl text-wafu-sumi">
            关于{" "}
            <span className="ml-2 align-middle font-sans text-xs tracking-[0.35em] text-wafu-sumi/55">
              私
            </span>
          </h1>
          <p className="mt-3 text-base text-wafu-sumi/70">
            写给那些过于安静的日子。
          </p>

          <div className="my-6 border-t border-dashed border-wafu-sumi/15" />

          <div className="prose max-w-none prose-slate prose-headings:font-serif prose-headings:text-wafu-sumi prose-a:text-wafu-shu prose-strong:text-wafu-sumi">
            <p>
              ERII 是一个以 <em>手写页</em> 为灵感的个人博客，也藏着《龙族》里那种温柔而无法回避的情绪。
            </p>
            <p>
              在这里，文字像纪念品一样被珍藏：一张塞进拍立得边框的照片，一道虚线的撕页痕，一只小黄鸭，以及一根怎么也解不开的红丝带。
            </p>
            <p>
              如果你找到了暗号，就让樱花落一次。然后合上写字板，继续往前走。
            </p>
          </div>
        </section>
      </div>

      <SecretTrigger />
    </div>
  );
}
