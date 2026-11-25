import { matchPath, useLocation } from "react-router-dom";
import admin from "./assets/bandi-admin.svg";
import detail from "./assets/bandi-detail.svg";
import enroll from "./assets/bandi-enroll.svg";
import list from "./assets/bandi-list.svg";
import login from "./assets/bandi-login.svg";
import my from "./assets/bandi-myclasses.svg";
import notifications from "./assets/bandi-notifications.svg";
import propose from "./assets/bandi-propose.svg";
import results from "./assets/bandi-voteresult.svg";
import signup from "./assets/bandi-signup.svg";
import vote from "./assets/bandi-vote.svg";

const guides = [
  ["/", list, "듣고 싶은 수업을 찾거나 직접 제안해 봐!"],
  ["/login", login, "다시 왔구나! 아이디로 로그인해 줘."],
  ["/signup", signup, "학교에서 받은 인증번호부터 넣어 줘."],
  ["/proposals/new", propose, "듣고 싶은 수업을 친구들과 제안해 봐!"],
  ["/proposals/:id", detail, "수업 내용과 진행 상황을 살펴봐!"],
  ["/proposals/:id/vote", vote, "갈 수 있는 날을 골라 줘."],
  ["/proposals/:id/result", results, "요일별 투표 결과를 확인해 봐!"],
  ["/enrollments", enroll, "학교에서 정한 날에 수강신청을 할 수 있어."],
  ["/my", my, "내가 관심을 표시한 수업과 제안을 확인해 봐."],
  ["/notifications", notifications, "기다리던 강좌가 열리면 알려 줄게."],
  ["/teacher", admin, "제안을 맡아 투표를 열고, 마감 후 수업 시간을 확정해 주세요."],
];

export default function BandiGuide({ welcome, user }) {
  const { pathname } = useLocation();
  const guide = guides.find(([path]) => matchPath(path, pathname));
  if (
    welcome ||
    !guide ||
    (!user && !["/login", "/signup"].includes(pathname))
  ) {
    return null;
  }
  const [, portrait, message] = guide;
  return (
    <aside className="bandi-guide" aria-label="반디의 안내">
      <p>{message}</p>
      <img src={portrait} alt="반디" width="92" height="92" />
    </aside>
  );
}
