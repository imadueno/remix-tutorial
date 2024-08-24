import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { ContactRecord, getContact, updateContact } from "../data";
import invariant from "tiny-invariant";
import type { FunctionComponent } from "react";

/**
 * ***********************************************
 * loader
 *
 * el loader se encarga de traer información "desde el server"
 * osea, hacer el SSR y enviarla al front
 * ***********************************************
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const contact = await getContact(params.contactId);

  /**
   * manejar la repuesta para cuando no se encuentra usuario
   *
   * obviamente como aqui es data estatica, estamos simulando la
   * posible respuesta de una API
   */
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ contact });
};

/**
 * ***********************************************
 * action
 * ***********************************************
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  const formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
};

export default function Contact() {
  const { contact } = useLoaderData<typeof loader>();

  return (
    <div id="contact">
      <div>
        <img
          alt={`${contact.first} ${contact.last} avatar`}
          key={contact.avatar}
          src={contact.avatar}
        />
      </div>

      <div>
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}{" "}
          <Favorite contact={contact} />
        </h1>

        {contact.twitter ? (
          <p>
            <a href={`https://twitter.com/${contact.twitter}`}>
              {contact.twitter}
            </a>
          </p>
        ) : null}

        {contact.notes ? <p>{contact.notes}</p> : null}

        <div>
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>

          <Form
            action="destroy"
            method="post"
            onSubmit={(event) => {
              const response = confirm(
                "Please confirm you want to delete this record."
              );
              if (!response) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

const Favorite: FunctionComponent<{
  contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
  /**
   * ********************************************
   * useFetcher
   *
   * es para hacer uso de los forms sin afectar la navegación
   * ********************************************
   */
  const fetcher = useFetcher();
  /**
   * fetcher tiene acceso a formData
   *
   * estamos haciendo un optimistic UI, esto quiere decir
   * que actualizamos el valor de favorite como si ya se hubiera hecho
   * la transacción: envio del front -> llega al back -> guarda -> genera
   * respuesta -> fecth -> pintar respuesta.
   *
   * en caso de que haya un error se revierte
   */
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    <fetcher.Form method="post">
      <button
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
};
