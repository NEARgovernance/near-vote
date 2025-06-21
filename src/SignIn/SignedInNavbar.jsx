import { signOut } from "@fastnear/api";

export function SignedInNavbar(props) {
  return (
    <>
      <li className="nav-item">
        <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>
          Sign Out
        </button>
      </li>
    </>
  );
}
