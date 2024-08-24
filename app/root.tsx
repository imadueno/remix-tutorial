import {
  json,
  LinksFunction,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";

import {
  Form,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

import { createEmptyContact, getContacts } from "./data";
import appStylesHref from "./app.css?url";
import { useEffect } from "react";

/**
 * links es diferente de Link, Link es para react router
 * links son los links que usamos tipicamente en html
 * link href etc. esto para taer el css
 */
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

/**
 * 1 loader por ruta, root.tsx es una ruta
 * loader contendrá la logica para poder cargar los datos desde
 * el servidor o desde una API
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

/**
 * Form - no manda un request al server, usa el action que
 * este en la ruta
 */
export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`);
};

export default function App() {
  /**
   * *******************************************************
   * Loader
   *
   * useLoaderData sera el "hook" que nos va regresar esa
   * data que cargó el loader
   *
   * typeof loader es necesario para poder inferir el tipo
   * de dato retornado
   * *******************************************************
   */
  const { contacts, q } = useLoaderData<typeof loader>();

  const navigation = useNavigation();

  const submit = useSubmit();

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  /**
   * *******************************************************
   * State
   * *******************************************************
   */
  useEffect(() => {
    const searchField = document.getElementById("q");

    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  /**
   * *******************************************************
   * JSX
   * *******************************************************
   */
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            {/*
             * este form no tiene method="", por lo tanto ejecuta un GET
             * por lo tanto solo se comportara como clickear un Link, solamente
             * la URL cambia
             *
             */}

            <Form
              id="search-form"
              role="search"
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
            >
              <input
                id="q"
                aria-label="Search contacts"
                className={searching ? "loading" : ""}
                defaultValue={q || ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>

            {/*
             * method="post" manda a llamar nuestro
             * "action" que esta en el archivo
             *
             */}

            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink
                      className={({ isActive, isPending }) =>
                        isActive ? "active" : isPending ? "pending" : ""
                      }
                      to={`contacts/${contact.id}`}
                    >
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? <span>★</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>
        <div
          className={
            navigation.state === "loading" && !searching ? "loading" : ""
          }
          id="detail"
        >
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
